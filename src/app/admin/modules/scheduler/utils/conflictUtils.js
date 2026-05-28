"use client";

/**
 * conflictUtils.js
 * Enterprise conflict detection engine.
 * Pure functions — no side effects, fully testable.
 *
 * 7 Conflict Types:
 *   1. CANDIDATE_DOUBLE_BOOK  [HARD]
 *   2. PANELIST_DOUBLE_BOOK   [HARD]
 *   3. OUTSIDE_WORKING_HOURS  [HARD]
 *   4. LUNCH_BREAK_OVERLAP    [SOFT]
 *   5. BUFFER_TIME_VIOLATION  [SOFT]
 *   6. CONSECUTIVE_OVERLOAD   [SOFT]
 *   7. TIMEZONE_MISMATCH      [INFO]
 */

import { timeToMinutes, minutesToTime, formatTime } from './calendarUtils.js';

// ─── Constants ────────────────────────────────────────────────────────────────

export const CONFLICT_SEVERITY = {
  HARD: 'HARD',   // Blocks scheduling
  SOFT: 'SOFT',   // Warning, can override
  INFO: 'INFO',   // Informational only
};

export const CONFLICT_TYPE = {
  CANDIDATE_DOUBLE_BOOK: 'CANDIDATE_DOUBLE_BOOK',
  PANELIST_DOUBLE_BOOK:  'PANELIST_DOUBLE_BOOK',
  OUTSIDE_WORKING_HOURS: 'OUTSIDE_WORKING_HOURS',
  LUNCH_BREAK_OVERLAP:   'LUNCH_BREAK_OVERLAP',
  BUFFER_TIME_VIOLATION: 'BUFFER_TIME_VIOLATION',
  CONSECUTIVE_OVERLOAD:  'CONSECUTIVE_OVERLOAD',
  TIMEZONE_MISMATCH:     'TIMEZONE_MISMATCH',
};

// Default scheduling config
const DEFAULT_CONFIG = {
  workingHoursStart: 9 * 60,   // 9:00 AM in minutes
  workingHoursEnd:  18 * 60,   // 6:00 PM in minutes
  lunchStart:       13 * 60,   // 1:00 PM
  lunchEnd:         14 * 60,   // 2:00 PM
  bufferMinutes:    15,         // 15 min gap between interviews
  maxConsecutiveHours: 3,       // max 3 hours of interviews in a row per panelist
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getEventInterval = (event) => ({
  start: timeToMinutes(event.time),
  end:   timeToMinutes(event.time) + (event.duration || 60),
});

const intervalsOverlap = (a, b) =>
  a.start < b.end && a.end > b.start;

const intervalsOverlapWithBuffer = (a, b, buffer) =>
  (a.start - buffer) < b.end && (a.end + buffer) > b.start;

// ─── Individual Conflict Detectors ────────────────────────────────────────────

/**
 * HARD: Candidate is already scheduled at overlapping time on same date.
 */
const checkCandidateDoubleBook = (newEvent, existingEvents) => {
  const conflicts = existingEvents.filter(ev =>
    ev.id !== newEvent.id &&
    ev.candidate_id === newEvent.candidate_id &&
    ev.date === newEvent.date &&
    ev.status !== 'cancelled' &&
    intervalsOverlap(getEventInterval(ev), getEventInterval(newEvent))
  );

  return conflicts.map(conflict => ({
    type:     CONFLICT_TYPE.CANDIDATE_DOUBLE_BOOK,
    severity: CONFLICT_SEVERITY.HARD,
    message:  `${newEvent.candidate_name} is already scheduled at ${formatTime(conflict.time)} on this date.`,
    detail:   `Overlapping with: ${conflict.candidate_name} — ${formatTime(conflict.time)} (${conflict.duration}m)`,
    conflictingEventId: conflict.id,
    suggestion: null,
    canOverride: false,
  }));
};

/**
 * HARD: A selected panelist is already booked at overlapping time.
 */
const checkPanelistDoubleBook = (newEvent, existingEvents, allPanelists) => {
  const results = [];
  const newInterval = getEventInterval(newEvent);
  const selectedIds = newEvent.panelists || [];

  selectedIds.forEach(panelistId => {
    const clashes = existingEvents.filter(ev =>
      ev.id !== newEvent.id &&
      ev.date === newEvent.date &&
      ev.status !== 'cancelled' &&
      (ev.panelists || []).includes(panelistId) &&
      intervalsOverlap(getEventInterval(ev), newInterval)
    );

    clashes.forEach(clash => {
      const panelist = allPanelists.find(p => p.id === panelistId);
      results.push({
        type:     CONFLICT_TYPE.PANELIST_DOUBLE_BOOK,
        severity: CONFLICT_SEVERITY.HARD,
        message:  `${panelist?.name || panelistId} is already in an interview at ${formatTime(clash.time)}.`,
        detail:   `${panelist?.name} is booked: ${formatTime(clash.time)} – ${formatTime(minutesToTime(timeToMinutes(clash.time) + clash.duration))}`,
        conflictingEventId: clash.id,
        panelistId,
        panelistName: panelist?.name,
        suggestion: null,
        canOverride: false,
      });
    });
  });

  return results;
};

/**
 * HARD: Interview time falls outside defined working hours.
 */
const checkOutsideWorkingHours = (newEvent, config = DEFAULT_CONFIG) => {
  const { start, end } = getEventInterval(newEvent);
  const results = [];

  if (start < config.workingHoursStart) {
    results.push({
      type:     CONFLICT_TYPE.OUTSIDE_WORKING_HOURS,
      severity: CONFLICT_SEVERITY.HARD,
      message:  `Interview starts before working hours (${minutesToTime(config.workingHoursStart)}).`,
      detail:   `Scheduled at ${formatTime(newEvent.time)}, but working hours begin at ${formatTime(minutesToTime(config.workingHoursStart))}.`,
      suggestion: minutesToTime(config.workingHoursStart),
      canOverride: false,
    });
  }

  if (end > config.workingHoursEnd) {
    results.push({
      type:     CONFLICT_TYPE.OUTSIDE_WORKING_HOURS,
      severity: CONFLICT_SEVERITY.HARD,
      message:  `Interview ends after working hours (${formatTime(minutesToTime(config.workingHoursEnd))}).`,
      detail:   `Interview runs until ${formatTime(minutesToTime(end))}, but working hours end at ${formatTime(minutesToTime(config.workingHoursEnd))}.`,
      suggestion: minutesToTime(config.workingHoursEnd - (newEvent.duration || 60)),
      canOverride: false,
    });
  }

  return results;
};

/**
 * SOFT: Interview overlaps with lunch break.
 */
const checkLunchBreak = (newEvent, config = DEFAULT_CONFIG) => {
  const newInterval = getEventInterval(newEvent);
  const lunchInterval = { start: config.lunchStart, end: config.lunchEnd };

  if (intervalsOverlap(newInterval, lunchInterval)) {
    return [{
      type:     CONFLICT_TYPE.LUNCH_BREAK_OVERLAP,
      severity: CONFLICT_SEVERITY.SOFT,
      message:  `Interview overlaps with the standard lunch break (1:00 – 2:00 PM).`,
      detail:   'Consider scheduling before 1:00 PM or after 2:00 PM for better panelist availability.',
      suggestion: minutesToTime(config.lunchEnd),
      canOverride: true,
    }];
  }
  return [];
};

/**
 * SOFT: Insufficient buffer time between this interview and adjacent ones for a panelist.
 */
const checkBufferTime = (newEvent, existingEvents, config = DEFAULT_CONFIG) => {
  const results = [];
  const newInterval = getEventInterval(newEvent);
  const buffer = config.bufferMinutes;
  const selectedPanelists = newEvent.panelists || [];

  existingEvents.forEach(ev => {
    if (ev.id === newEvent.id || ev.date !== newEvent.date || ev.status === 'cancelled') return;

    const sharedPanelists = (ev.panelists || []).filter(p => selectedPanelists.includes(p));
    if (!sharedPanelists.length) return;

    if (intervalsOverlapWithBuffer(getEventInterval(ev), newInterval, buffer) &&
        !intervalsOverlap(getEventInterval(ev), newInterval)) {
      results.push({
        type:     CONFLICT_TYPE.BUFFER_TIME_VIOLATION,
        severity: CONFLICT_SEVERITY.SOFT,
        message:  `Less than ${buffer} minute buffer between interviews for shared panelist(s).`,
        detail:   `Interview at ${formatTime(ev.time)} leaves insufficient transition time.`,
        conflictingEventId: ev.id,
        suggestion: null,
        canOverride: true,
      });
    }
  });

  return results;
};

/**
 * SOFT: A panelist would have >3 consecutive hours of interviews.
 */
const checkConsecutiveOverload = (newEvent, existingEvents, config = DEFAULT_CONFIG) => {
  const results = [];
  const selectedPanelists = newEvent.panelists || [];

  selectedPanelists.forEach(panelistId => {
    const dayEvents = existingEvents.filter(ev =>
      ev.date === newEvent.date &&
      ev.status !== 'cancelled' &&
      ev.id !== newEvent.id &&
      (ev.panelists || []).includes(panelistId)
    );

    const allEvents = [...dayEvents, newEvent].sort((a, b) =>
      timeToMinutes(a.time) - timeToMinutes(b.time)
    );

    // Calculate max continuous block
    let maxBlock = 0, blockStart = -1, blockEnd = -1;
    allEvents.forEach(ev => {
      const { start, end } = getEventInterval(ev);
      if (blockEnd < 0 || start > blockEnd + config.bufferMinutes) {
        blockStart = start;
        blockEnd   = end;
      } else {
        blockEnd = Math.max(blockEnd, end);
      }
      maxBlock = Math.max(maxBlock, blockEnd - blockStart);
    });

    if (maxBlock > config.maxConsecutiveHours * 60) {
      results.push({
        type:     CONFLICT_TYPE.CONSECUTIVE_OVERLOAD,
        severity: CONFLICT_SEVERITY.SOFT,
        message:  `Panelist will have ${Math.round(maxBlock / 60 * 10) / 10}h of back-to-back interviews.`,
        detail:   `Recommended max is ${config.maxConsecutiveHours}h of consecutive interviews.`,
        suggestion: null,
        canOverride: true,
      });
    }
  });

  return results;
};

/**
 * INFO: Platform is cross-timezone and no timezone specified.
 */
const checkTimezoneMismatch = (newEvent) => {
  if (!newEvent.timezone || newEvent.timezone === 'Asia/Kolkata') return [];
  return [{
    type:     CONFLICT_TYPE.TIMEZONE_MISMATCH,
    severity: CONFLICT_SEVERITY.INFO,
    message:  `Interview timezone (${newEvent.timezone}) differs from default IST.`,
    detail:   'Ensure all participants are aware of the timezone difference.',
    suggestion: null,
    canOverride: true,
  }];
};

// ─── Main Conflict Detector ───────────────────────────────────────────────────

/**
 * Run all conflict checks on a proposed event.
 *
 * @param {Object} newEvent       - Event being scheduled/moved
 * @param {Array}  existingEvents - All current scheduler events
 * @param {Array}  allPanelists   - Full panelist list
 * @param {Object} config         - Optional scheduling config overrides
 * @returns {Array<ConflictResult>} Sorted by severity (HARD first)
 */
export const detectConflicts = (newEvent, existingEvents, allPanelists, config = {}) => {
  if (!newEvent?.date || !newEvent?.time) return [];

  const cfg = { ...DEFAULT_CONFIG, ...config };

  const conflicts = [
    ...checkCandidateDoubleBook(newEvent, existingEvents),
    ...checkPanelistDoubleBook(newEvent, existingEvents, allPanelists),
    ...checkOutsideWorkingHours(newEvent, cfg),
    ...checkLunchBreak(newEvent, cfg),
    ...checkBufferTime(newEvent, existingEvents, cfg),
    ...checkConsecutiveOverload(newEvent, existingEvents, cfg),
    ...checkTimezoneMismatch(newEvent),
  ];

  // Sort: HARD → SOFT → INFO
  const order = { [CONFLICT_SEVERITY.HARD]: 0, [CONFLICT_SEVERITY.SOFT]: 1, [CONFLICT_SEVERITY.INFO]: 2 };
  return conflicts.sort((a, b) => order[a.severity] - order[b.severity]);
};

/** Returns true if any HARD conflicts exist (blocks scheduling) */
export const hasHardConflicts = (conflicts) =>
  conflicts.some(c => c.severity === CONFLICT_SEVERITY.HARD);

/** Returns true if any conflicts exist */
export const hasAnyConflicts = (conflicts) => conflicts.length > 0;

/** Filter conflicts by severity */
export const getConflictsBySeverity = (conflicts, severity) =>
  conflicts.filter(c => c.severity === severity);

