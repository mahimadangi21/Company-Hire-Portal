"use client";

/**
 * useScheduler.js
 * Main orchestrator hook. Coordinates API calls, state dispatch,
 * polling, and notification management.
 * Max 200 lines — business logic only, no JSX.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';
import { fetchInterviews, createInterview, updateInterview, deleteInterview } from '../services/schedulerAPI.js';
import { createMeeting, cancelMeeting } from '../services/calendarProviders/index.js';

export const INTERVIEW_TEMPLATES = [
  { id: 'technical',     label: 'Technical Interview',    defaultDuration: 60 },
  { id: 'system-design', label: 'System Design',          defaultDuration: 90 },
  { id: 'hr',            label: 'HR / Culture Fit',       defaultDuration: 45 },
  { id: 'portfolio',     label: 'Portfolio Review',       defaultDuration: 45 },
  { id: 'coding',        label: 'Live Coding',            defaultDuration: 90 },
  { id: 'final',         label: 'Final Round',            defaultDuration: 60 },
];

const POLL_INTERVAL = 15000; // 15s (ready for Socket.IO swap)

// ─── Notification Helper ──────────────────────────────────────────────────────

let notifCounter = 0;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useScheduler = () => {
  const { state, dispatch } = useSchedulerContext();
  const pollRef = useRef(null);

  // ── Notifications ──────────────────────────────────────────────────────────

  const notify = useCallback((type, message, action = null) => {
    const id = `notif-${++notifCounter}-${Date.now()}`;
    dispatch({
      type:    ACTIONS.PUSH_NOTIFICATION,
      payload: { id, type, message, action, createdAt: Date.now() },
    });
    // Auto-dismiss after 4s
    setTimeout(() => dispatch({ type: ACTIONS.DISMISS_NOTIFICATION, payload: id }), 4000);
  }, [dispatch]);

  // ── Data Loading ───────────────────────────────────────────────────────────

  const loadInterviews = useCallback(async () => {
    try {
      const data = await fetchInterviews();
      dispatch({ type: ACTIONS.SET_INTERVIEWS, payload: data });
    } catch (err) {
      console.error('[Scheduler] Failed to load interviews:', err);
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      notify('error', 'Failed to load interviews. Please refresh.');
    }
  }, [dispatch, notify]);

  // Initial load
  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  // Polling (real-time readiness: swap for socket.on('interview:*') later)
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchInterviews()
        .then(data => dispatch({ type: ACTIONS.SET_INTERVIEWS, payload: data }))
        .catch(() => {});
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [dispatch]);

  // ── Schedule Interview ─────────────────────────────────────────────────────

  const scheduleInterview = useCallback(async (formData) => {
    dispatch({ type: ACTIONS.SET_MODAL_LOADING, payload: true });
    
    // Strict requirement: Platform is MS Teams, notifyTeams is mandatory
    const strictFormData = {
      ...formData,
      platform: 'teams',
      notifyTeams: true,
      notifyEmail: false,
      notifySlack: false,
    };

    try {
      // 1. Generate meeting link via Teams provider
      const meeting = await createMeeting(strictFormData.platform, {
        title:     `Technical Interview – ${strictFormData.candidateName}`,
        date:      strictFormData.date,
        time:      strictFormData.time,
        duration:  strictFormData.duration,
        attendees: [],
        notes:     strictFormData.notes,
      });

      // 2. Build interview record
      const interview = {
        candidate_id:   strictFormData.candidateId,
        candidate_name: strictFormData.candidateName,
        candidate_email:strictFormData.candidateEmail,
        job_role:       strictFormData.jobRole,
        round:          strictFormData.round || 1,
        template:       'technical',
        panelists:      strictFormData.panelistIds,
        date:           strictFormData.date,
        time:           strictFormData.time,
        duration:       strictFormData.duration,
        platform:       strictFormData.platform,
        meeting_link:   meeting.link,
        meeting_id:     meeting.id,
        status:         'scheduled',
        notes:          strictFormData.notes,
        timezone:       strictFormData.timezone || 'Asia/Kolkata',
        notify_email:   false,
        notify_teams:   true,
      };

      // 3. Persist
      const created = await createInterview(interview);

      // 4. Add to state
      dispatch({ type: ACTIONS.ADD_INTERVIEW, payload: created });
      dispatch({ type: ACTIONS.CLOSE_MODAL });
      
      // Strict Teams message dispatch simulator notifications (Candidate + Panelists)
      notify('success', `Technical Interview scheduled for ${strictFormData.candidateName} on ${strictFormData.date} at ${strictFormData.time}`);

      // Candidate Teams Notification
      setTimeout(() => {
        notify('info', `💬 [Teams Message Sent to Candidate (${strictFormData.candidateEmail})]
Hello ${strictFormData.candidateName}, your Technical Interview is confirmed for ${strictFormData.date} at ${strictFormData.time}.
Teams Meeting Link: ${meeting.link}
Please join promptly.`);
      }, 1000);

      // Panelist Teams Notification
      setTimeout(() => {
        const panelistsList = (strictFormData.panelistIds || []).map(id => state.panelists.find(p => p.id === id)).filter(Boolean);
        panelistsList.forEach(p => {
          notify('info', `💬 [Teams Message Sent to Panelist (${p.name})]
You are assigned to conduct a Technical Interview for ${strictFormData.candidateName} on ${strictFormData.date} at ${strictFormData.time}.
Teams Meeting Link: ${meeting.link}`);
        });
      }, 2000);

      return created;
    } catch (err) {
      console.error('[Scheduler] Schedule failed:', err);
      notify('error', `Failed to schedule interview. ${err?.message || ''}`);
      throw err;
    } finally {
      dispatch({ type: ACTIONS.SET_MODAL_LOADING, payload: false });
    }
  }, [dispatch, notify, state.panelists]);

  // ── Reschedule (drag/drop or edit) ────────────────────────────────────────

  const rescheduleInterview = useCallback(async (id, { date, time, duration }) => {
    const optKey = `drag-${id}`;

    // Optimistic update
    dispatch({
      type:    ACTIONS.OPTIMISTIC_UPDATE,
      payload: { key: optKey, id, changes: { date, time, duration } },
    });

    try {
      await updateInterview(id, { date, time, duration });
      // Clear optimistic queue on success (no rollback needed)
    } catch (err) {
      dispatch({ type: ACTIONS.ROLLBACK_OPTIMISTIC, payload: optKey });
      notify('error', 'Failed to reschedule interview. Changes reverted.');
    }
  }, [dispatch, notify]);

  // ── Cancel Interview ───────────────────────────────────────────────────────

  const cancelScheduledInterview = useCallback(async (id) => {
    const interview = state.interviews.find(iv => iv.id === id);
    if (!interview) return;

    try {
      await updateInterview(id, { status: 'cancelled' });
      dispatch({ type: ACTIONS.UPDATE_INTERVIEW, payload: { id, status: 'cancelled' } });

      // Cancel on platform
      if (interview.meeting_id && interview.platform !== 'inperson') {
        cancelMeeting(interview.platform, interview.meeting_id).catch(() => {});
      }

      notify('success', `Interview for ${interview.candidate_name} has been cancelled.`);
    } catch (err) {
      notify('error', 'Failed to cancel interview.');
    }
  }, [state.interviews, dispatch, notify]);

  // ── Modal Actions ──────────────────────────────────────────────────────────

  const openModal = useCallback((prefill = {}) => {
    dispatch({ type: ACTIONS.OPEN_MODAL, payload: prefill });
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_MODAL });
  }, [dispatch]);

  const openDrawer = useCallback((interviewId) => {
    dispatch({ type: ACTIONS.OPEN_DRAWER, payload: interviewId });
  }, [dispatch]);

  const closeDrawer = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_DRAWER });
  }, [dispatch]);

  return {
    state,
    dispatch,
    // Actions
    loadInterviews,
    scheduleInterview,
    rescheduleInterview,
    cancelScheduledInterview,
    openModal,
    closeModal,
    openDrawer,
    closeDrawer,
    notify,
    // Constants
    panelists: state.panelists,
    INTERVIEW_TEMPLATES,
  };
};
