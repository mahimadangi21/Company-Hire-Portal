/**
 * useCalendarDrag.js
 * Enterprise-grade drag/drop and resize for calendar events.
 * Uses HTML5 drag API + pointer events for smooth 60fps performance.
 * No external libraries.
 */

import { useCallback, useRef } from 'react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';
import { pxDeltaToMinutes, snapToGrid, minutesToTime, timeToMinutes, PIXELS_PER_MIN, SLOT_MINUTES, getDateKey } from '../utils/calendarUtils.js';

export const useCalendarDrag = ({ onReschedule }) => {
  const { state, dispatch } = useSchedulerContext();

  // Refs to avoid stale closures during pointer events
  const dragRef = useRef({
    active:        false,
    eventId:       null,
    startY:        0,
    startX:        0,
    originalTime:  '',
    originalDate:  '',
    originalDuration: 0,
    isResizing:    false,
  });

  // ── Drag Start (from event card) ───────────────────────────────────────────

  const handleDragStart = useCallback((e, interview) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('interviewId', interview.id);

    // Use setTimeout so ghost image renders before drag starts
    setTimeout(() => {
      dispatch({
        type:    ACTIONS.DRAG_START,
        payload: {
          eventId: interview.id,
          date:    interview.date,
          time:    interview.time,
        },
      });
    }, 0);
  }, [dispatch]);

  // ── Drag Over (on calendar slot) ───────────────────────────────────────────

  const handleSlotDragOver = useCallback((e, date, time) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const newDate = getDateKey(date);
    if (state.drag.ghostDate !== newDate || state.drag.ghostTime !== time) {
      dispatch({
        type:    ACTIONS.DRAG_OVER,
        payload: { date: newDate, time },
      });
    }
  }, [dispatch, state.drag.ghostDate, state.drag.ghostTime]);

  // ── Drop (on calendar slot) ────────────────────────────────────────────────

  const handleSlotDrop = useCallback(async (e, date, time) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('interviewId');
    if (!eventId) return;

    const newDate = getDateKey(date);
    dispatch({ type: ACTIONS.DRAG_END });

    // Only call reschedule if something actually changed
    const original = state.interviews.find(iv => iv.id === eventId);
    if (!original) return;
    if (original.date === newDate && original.time === time) return;

    await onReschedule(eventId, { date: newDate, time, duration: original.duration });
  }, [dispatch, state.interviews, onReschedule]);

  // ── Drag End (cleanup if dropped outside valid zone) ─────────────────────

  const handleDragEnd = useCallback(() => {
    if (state.drag.active) {
      dispatch({ type: ACTIONS.DRAG_END });
    }
  }, [dispatch, state.drag.active]);

  // ── Resize (pointer events on bottom handle) ───────────────────────────────

  const handleResizeStart = useCallback((e, interview) => {
    e.preventDefault();
    e.stopPropagation();

    dragRef.current = {
      active:           true,
      eventId:          interview.id,
      startY:           e.clientY,
      originalDuration: interview.duration,
      isResizing:       true,
    };

    dispatch({
      type:    ACTIONS.RESIZE_START,
      payload: { eventId: interview.id, duration: interview.duration },
    });

    const onMove = (moveEvent) => {
      if (!dragRef.current.active) return;

      const deltaY    = moveEvent.clientY - dragRef.current.startY;
      const deltaMins = pxDeltaToMinutes(deltaY);
      const newDuration = Math.max(
        SLOT_MINUTES,
        snapToGrid(dragRef.current.originalDuration + deltaMins)
      );

      dispatch({ type: ACTIONS.RESIZE_UPDATE, payload: newDuration });
    };

    const onUp = async () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup',   onUp);

      const finalDuration = state.resize.ghostDuration || dragRef.current.originalDuration;
      dragRef.current.active = false;

      dispatch({ type: ACTIONS.RESIZE_END });

      if (finalDuration !== dragRef.current.originalDuration) {
        await onReschedule(dragRef.current.eventId, {
          date:     interview.date,
          time:     interview.time,
          duration: finalDuration,
        });
      }
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerup',   onUp);
  }, [dispatch, state.resize.ghostDuration, onReschedule]);

  // ── Slot Click (open modal pre-filled) ────────────────────────────────────

  const handleSlotClick = useCallback((date, time) => {
    if (state.drag.active || state.resize.active) return;
    dispatch({
      type:    ACTIONS.OPEN_MODAL,
      payload: {
        date: getDateKey(date),
        time,
      },
    });
  }, [dispatch, state.drag.active, state.resize.active]);

  return {
    // Event card handlers
    handleDragStart,
    handleDragEnd,
    handleResizeStart,

    // Slot handlers
    handleSlotDragOver,
    handleSlotDrop,
    handleSlotClick,

    // Drag state (for rendering ghost/highlight)
    isDragging:    state.drag.active,
    isResizing:    state.resize.active,
    dragEventId:   state.drag.eventId,
    ghostDate:     state.drag.ghostDate,
    ghostTime:     state.drag.ghostTime,
    ghostDuration: state.resize.ghostDuration,
  };
};
