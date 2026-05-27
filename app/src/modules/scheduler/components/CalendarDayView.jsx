/**
 * CalendarDayView.jsx
 * Single-day detailed calendar. Same pixel-positioning engine as week view.
 * Fixed: cal-days-area wrapper pattern (matches CalendarWeekView).
 */

import React, { useMemo, useRef, useEffect, memo, useCallback } from 'react';
import {
  getTimeSlots, getDateKey, formatDateShort,
  calculateEventLayout, isToday, pxToTime,
  CALENDAR_HEIGHT, PIXELS_PER_MIN, START_HOUR, getCurrentTimePx,
} from '../utils/calendarUtils.js';
import { useSchedulerContext } from '../store/schedulerReducer.js';
import CalendarEventCard from './CalendarEventCard.jsx';

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

export default function CalendarDayView({
  onSlotClick, onSlotDragOver, onSlotDrop,
  onEventDragStart, onEventDragEnd, onEventResize, onEventClick,
  dragEventId, ghostDate, ghostTime, isDragging, isResizing, ghostDuration,
}) {
  const { state }  = useSchedulerContext();
  const { interviews, currentDate } = state;
  const scrollRef  = useRef(null);
  const today      = isToday(currentDate);
  const dateKey    = getDateKey(currentDate);
  const timeSlots  = useMemo(() => getTimeSlots(), []);

  const events = useMemo(
    () => calculateEventLayout(
      interviews.filter(iv => iv.date === dateKey && iv.status !== 'cancelled')
    ),
    [interviews, dateKey]
  );

  // Scroll to 9 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      const target = (9 - START_HOUR) * 60 * PIXELS_PER_MIN - 32;
      scrollRef.current.scrollTop = Math.max(0, target);
    }
  }, [currentDate]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const time  = pxToTime(e.clientY - rect.top);
    onSlotDragOver?.(e, currentDate, time);
  }, [currentDate, onSlotDragOver]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const time  = pxToTime(e.clientY - rect.top);
    onSlotDrop?.(e, currentDate, time);
  }, [currentDate, onSlotDrop]);

  return (
    <div className="cal-day-view">
      {/* Sticky header */}
      <div className="cal-week-header">
        <div className="cal-time-gutter-header" />
        <div className={`cal-day-header cal-day-header--full ${today ? 'cal-day-header--today' : ''}`}>
          <span className="cal-day-header__name">{formatDateShort(currentDate)}</span>
          {today && <span className="cal-day-today-pill">Today</span>}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="cal-week-scroll" ref={scrollRef}>
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

          {/* Days area: hour lines + single column */}
          <div className="cal-days-area">
            {/* Hour lines overlay */}
            <div className="cal-grid-lines">
              {timeSlots.map(({ hour }) => (
                <div
                  key={hour}
                  className="cal-hour-line"
                  style={{ top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MIN}px` }}
                />
              ))}
            </div>

            {/* Single day column (full width) */}
            <div
              className={`cal-day-col cal-day-col--single ${today ? 'cal-day-col--today' : ''} ${isDragging && ghostDate === dateKey ? 'cal-day-col--drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Slot click zones */}
              {timeSlots.map(({ hour }) => (
                <div
                  key={hour}
                  className="cal-slot"
                  style={{ top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MIN}px` }}
                  onClick={() => onSlotClick?.(currentDate, `${String(hour).padStart(2,'0')}:00`)}
                />
              ))}

              {/* Events */}
              {events.map(event => (
                <CalendarEventCard
                  key={event.id}
                  interview={{
                    ...event,
                    duration: (event.id === dragEventId && isResizing)
                      ? (ghostDuration || event.duration)
                      : event.duration,
                  }}
                  col={event._col || 0}
                  totalCols={event._totalCols || 1}
                  isDragging={event.id === dragEventId && !isResizing}
                  isGhost={false}
                  onDragStart={onEventDragStart}
                  onDragEnd={onEventDragEnd}
                  onResizeStart={onEventResize}
                  onClick={onEventClick}
                />
              ))}

              {today && <CurrentTimeLine />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
