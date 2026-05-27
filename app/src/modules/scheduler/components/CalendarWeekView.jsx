/**
 * CalendarWeekView.jsx
 * Microsoft Teams-style week calendar.
 * Pixel-positioned events, sticky headers, current time line, drag & drop.
 * Fixed: cal-days-area wrapper prevents grid-lines from consuming a grid track.
 */

import React, { useMemo, useRef, useEffect, memo, useCallback } from 'react';
import {
  getWeekDays, getTimeSlots, getDateKey,
  groupEventsByDate, calculateEventLayout, isToday,
  pxToTime, CALENDAR_HEIGHT, PIXELS_PER_MIN, START_HOUR,
  DAYS_SHORT, getCurrentTimePx,
} from '../utils/calendarUtils.js';
import { useSchedulerContext } from '../store/schedulerReducer.js';
import CalendarEventCard from './CalendarEventCard.jsx';

// ─── Current Time Indicator ───────────────────────────────────────────────────

const CurrentTimeLine = memo(() => {
  const topPx = getCurrentTimePx();
  if (topPx < 0) return null;
  return (
    <div className="cal-current-time" style={{ top: `${topPx}px` }}>
      <div className="cal-current-time__dot" />
    </div>
  );
});
CurrentTimeLine.displayName = 'CurrentTimeLine';

// ─── Day Column ───────────────────────────────────────────────────────────────

const DayColumn = memo(({
  day, dateKey, events, today,
  isDragOver,
  onSlotClick, onSlotDragOver, onSlotDrop,
  onEventDragStart, onEventDragEnd, onEventResize, onEventClick,
  dragEventId, isResizing, ghostDuration,
}) => {
  const laidOut = useMemo(() => calculateEventLayout(events), [events]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const time  = pxToTime(e.clientY - rect.top);
    onSlotDragOver?.(e, day, time);
  }, [day, onSlotDragOver]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const time  = pxToTime(e.clientY - rect.top);
    onSlotDrop?.(e, day, time);
  }, [day, onSlotDrop]);

  return (
    <div
      className={`cal-day-col ${today ? 'cal-day-col--today' : ''} ${isDragOver ? 'cal-day-col--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Slot rows for click-to-schedule */}
      {getTimeSlots().map(({ hour }) => (
        <div
          key={hour}
          className="cal-slot"
          style={{ top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MIN}px` }}
          onClick={() => onSlotClick?.(day, `${String(hour).padStart(2,'0')}:00`)}
        />
      ))}

      {/* Events */}
      {laidOut.map(event => {
        const isBeingDragged = event.id === dragEventId;
        const displayDuration = isBeingDragged && isResizing
          ? (ghostDuration || event.duration)
          : event.duration;
        return (
          <CalendarEventCard
            key={event.id}
            interview={{ ...event, duration: displayDuration }}
            col={event._col || 0}
            totalCols={event._totalCols || 1}
            isDragging={isBeingDragged && !isResizing}
            isGhost={false}
            onDragStart={onEventDragStart}
            onDragEnd={onEventDragEnd}
            onResizeStart={onEventResize}
            onClick={onEventClick}
          />
        );
      })}

      {today && <CurrentTimeLine />}
    </div>
  );
});
DayColumn.displayName = 'DayColumn';

// ─── Main Week View ───────────────────────────────────────────────────────────

export default function CalendarWeekView({
  onSlotClick, onSlotDragOver, onSlotDrop,
  onEventDragStart, onEventDragEnd, onEventResize, onEventClick,
  dragEventId, ghostDate, ghostTime,
  isDragging, isResizing, ghostDuration,
}) {
  const { state }   = useSchedulerContext();
  const { interviews, currentDate } = state;
  const scrollRef   = useRef(null);
  const timeSlots   = useMemo(() => getTimeSlots(), []);
  const weekDays    = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const eventsByDate = useMemo(
    () => groupEventsByDate(interviews.filter(iv => iv.status !== 'cancelled')),
    [interviews]
  );

  // Scroll to 9 AM on mount / week change
  useEffect(() => {
    if (scrollRef.current) {
      const target = (9 - START_HOUR) * 60 * PIXELS_PER_MIN - 32;
      scrollRef.current.scrollTop = Math.max(0, target);
    }
  }, [currentDate]);

  return (
    <div className="cal-week-view">

      {/* Sticky header row */}
      <div className="cal-week-header">
        <div className="cal-time-gutter-header" />
        {weekDays.map(day => {
          const today = isToday(day);
          return (
            <div key={getDateKey(day)} className={`cal-day-header ${today ? 'cal-day-header--today' : ''}`}>
              <span className="cal-day-header__name">{DAYS_SHORT[day.getDay()]}</span>
              <span className={`cal-day-header__num ${today ? 'cal-day-header__num--today' : ''}`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div className="cal-week-scroll" ref={scrollRef}>
        {/*
          Two-column grid: [time-gutter] [days-area]
          cal-days-area is a separate 7-column grid so the
          hour-line overlay doesn't consume a grid track.
        */}
        <div className="cal-week-grid" style={{ height: `${CALENDAR_HEIGHT}px` }}>

          {/* Time gutter */}
          <div className="cal-time-gutter">
            {timeSlots.map(({ hour, label }) => (
              <div
                key={hour}
                className="cal-time-label"
                style={{ top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MIN}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Days area: contains background hour lines + 7 day columns */}
          <div className="cal-days-area">
            {/* Hour lines (absolutely positioned inside days area) */}
            <div className="cal-grid-lines">
              {timeSlots.map(({ hour }) => (
                <div
                  key={hour}
                  className="cal-hour-line"
                  style={{ top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MIN}px` }}
                />
              ))}
            </div>

            {/* 7 Day columns */}
            {weekDays.map(day => {
              const dateKey = getDateKey(day);
              return (
                <DayColumn
                  key={dateKey}
                  day={day}
                  dateKey={dateKey}
                  events={eventsByDate[dateKey] || []}
                  today={isToday(day)}
                  isDragOver={isDragging && ghostDate === dateKey}
                  onSlotClick={onSlotClick}
                  onSlotDragOver={onSlotDragOver}
                  onSlotDrop={onSlotDrop}
                  onEventDragStart={onEventDragStart}
                  onEventDragEnd={onEventDragEnd}
                  onEventResize={onEventResize}
                  onEventClick={onEventClick}
                  dragEventId={dragEventId}
                  isResizing={isResizing}
                  ghostDuration={ghostDuration}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
