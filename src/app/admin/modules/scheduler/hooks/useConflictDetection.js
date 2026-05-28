"use client";

/**
 * useConflictDetection.js
 * Real-time conflict checking hook.
 * Runs conflict engine whenever modal form data changes.
 */

import { useEffect, useCallback } from 'react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';
import { detectConflicts, hasHardConflicts } from '../utils/conflictUtils.js';

export const useConflictDetection = () => {
  const { state, dispatch } = useSchedulerContext();

  const { formData } = state.modal;

  // Build a normalized event object from modal form data for conflict checking
  const buildEventFromForm = useCallback((form) => {
    if (!form.date || !form.time || !form.panelistIds?.length) return null;
    return {
      id:           '__new__',
      candidate_id: form.candidateId,
      candidate_name: form.candidateName,
      date:         form.date,
      time:         form.time,
      duration:     form.duration || 60,
      panelists:    form.panelistIds,
      status:       'scheduled',
      timezone:     form.timezone,
    };
  }, []);

  // Run detection whenever relevant form fields change
  useEffect(() => {
    if (!state.modal.open) {
      dispatch({ type: ACTIONS.CLEAR_CONFLICTS });
      return;
    }

    const event = buildEventFromForm(formData);
    if (!event) {
      dispatch({ type: ACTIONS.CLEAR_CONFLICTS });
      return;
    }

    // Exclude the event being edited (if editing)
    const existing = state.interviews.filter(iv => iv.id !== formData.editingId);
    const conflicts = detectConflicts(event, existing, state.panelists);

    dispatch({ type: ACTIONS.SET_CONFLICTS, payload: conflicts });
  }, [
    formData.date,
    formData.time,
    formData.duration,
    formData.panelistIds,
    formData.candidateId,
    formData.timezone,
    state.modal.open,
    state.interviews,
    buildEventFromForm,
    dispatch,
  ]);

  const clearConflicts = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CONFLICTS });
  }, [dispatch]);

  return {
    conflicts:       state.conflicts,
    hasHard:         hasHardConflicts(state.conflicts),
    conflictCount:   state.conflicts.length,
    clearConflicts,
  };
};
