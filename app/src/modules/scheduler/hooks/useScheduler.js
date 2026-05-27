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

// ─── Panelists Constant (extendable to API later) ──────────────────────────────

export const PANELISTS = [];

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
    try {
      // 1. Generate meeting link via provider
      const meeting = await createMeeting(formData.platform, {
        title:     `${formData.template} Interview – ${formData.candidateName}`,
        date:      formData.date,
        time:      formData.time,
        duration:  formData.duration,
        attendees: [],
        notes:     formData.notes,
      });

      // 2. Build interview record
      const interview = {
        candidate_id:   formData.candidateId,
        candidate_name: formData.candidateName,
        candidate_email:formData.candidateEmail,
        job_role:       formData.jobRole,
        round:          formData.round,
        template:       formData.template,
        panelists:      formData.panelistIds,
        date:           formData.date,
        time:           formData.time,
        duration:       formData.duration,
        platform:       formData.platform,
        meeting_link:   meeting.link,
        meeting_id:     meeting.id,
        status:         'scheduled',
        notes:          formData.notes,
        timezone:       formData.timezone || 'Asia/Kolkata',
        notify_email:   formData.notifyEmail,
        notify_teams:   formData.notifyTeams,
      };

      // 3. Persist
      const created = await createInterview(interview);

      // 4. Add to state
      dispatch({ type: ACTIONS.ADD_INTERVIEW, payload: created });
      dispatch({ type: ACTIONS.CLOSE_MODAL });
      notify('success', `Interview scheduled for ${formData.candidateName} on ${formData.date} at ${formData.time}`);

      return created;
    } catch (err) {
      console.error('[Scheduler] Schedule failed:', err);
      notify('error', `Failed to schedule interview. ${err?.message || ''}`);
      throw err;
    } finally {
      dispatch({ type: ACTIONS.SET_MODAL_LOADING, payload: false });
    }
  }, [dispatch, notify]);

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
    PANELISTS,
    INTERVIEW_TEMPLATES,
  };
};
