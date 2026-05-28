"use client";

/**
 * useAvailability.js
 * Availability matrix computation and smart slot suggestion hook.
 * Memoized to prevent excessive recalculation.
 */

import { useMemo, useCallback } from 'react';
import { useSchedulerContext } from '../store/schedulerReducer.js';
import {
  generateAvailabilityMatrix,
  calculatePanelistWorkload,
  suggestBestSlots,
  getPanelistDayStatus,
} from '../utils/availabilityUtils.js';
import { getDateKey } from '../utils/calendarUtils.js';
import { PANELISTS } from './useScheduler.js';

export const useAvailability = () => {
  const { state } = useSchedulerContext();
  const { interviews, currentDate, modal } = state;

  // Memoized matrix — only recomputes when interviews or week changes
  const matrix = useMemo(
    () => generateAvailabilityMatrix(PANELISTS, interviews, currentDate),
    [interviews, currentDate]
  );

  // Workload for each panelist in current week
  const workloads = useMemo(
    () => Object.fromEntries(
      PANELISTS.map(p => [
        p.id,
        calculatePanelistWorkload(p.id, interviews, currentDate)
      ])
    ),
    [interviews, currentDate]
  );

  // Smart slot suggestions (only when modal is open + panelists selected)
  const suggestions = useMemo(() => {
    const pIds = modal.formData.panelistIds || [];
    if (!modal.open || !pIds.length) return [];

    return suggestBestSlots(
      matrix,
      pIds,
      modal.formData.duration || 60,
      new Date()
    );
  }, [matrix, modal.open, modal.formData.panelistIds, modal.formData.duration]);

  // Per-day availability status for a panelist (for sidebar dots)
  const getPanelistStatus = useCallback((panelistId, date) => {
    return getPanelistDayStatus(panelistId, getDateKey(date), matrix);
  }, [matrix]);

  // Get all slots for a specific panelist + day
  const getPanelistDaySlots = useCallback((panelistId, dateKey) => {
    return matrix[panelistId]?.[dateKey] || {};
  }, [matrix]);

  return {
    matrix,
    workloads,
    suggestions,
    getPanelistStatus,
    getPanelistDaySlots,
  };
};

