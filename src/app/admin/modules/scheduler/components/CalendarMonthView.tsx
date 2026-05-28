"use client";

/**
 * CalendarMonthView.jsx
 * Standard month grid with event dots, click-to-day, and event overflow handling.
 */

import React, { useMemo, memo } from 'react';
import {
  getMonthGrid, getDateKey, isToday, groupEventsByDate,
  DAYS_SHORT, MONTHS, formatTime,
} from '../utils/calendarUtils.js';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';

const MAX_VISIBLE = 3;

const StatusDot = memo(({ status }) => (
  <div className={`cal-month-dot cal-month-dot--${status}`} />
));
StatusDot.displayName = 'StatusDot';

const MonthEventChip = memo(({ interview, onClick }) => (
  <button
    className="cal-month-chip"
    onClick={(e) => { e.stopPropagation(); onClick?.(interview.id); }}
    title={`${interview.candidate_name} — ${formatTime(interview.time)}`}
  >
    <StatusDot status={interview.status} />
    <span className="cal-month-chip__name">{interview.candidate_name}</span>
    <span className="cal-month-chip__time">{formatTime(interview.time)}</span>
  </button>
));
MonthEventChip.displayName = 'MonthEventChip';

export default function CalendarMonthView({ onEventClick }) {
  const { state, dispatch } = useSchedulerContext();
  const { interviews, currentDate } = state;

  const monthGrid  = useMemo(() => getMonthGrid(currentDate), [currentDate]);
  const eventsByDate = useMemo(
    () => groupEventsByDate(interviews.filter(iv => iv.status !== 'cancelled')),
    [interviews]
  );

  const goToDay = (date) => {
    dispatch({ type: ACTIONS.SET_SELECTED_DATE, payload: date });
    dispatch({ type: ACTIONS.SET_VIEW, payload: 'day' });
  };

  return (
    <div className="cal-month-view">
      {/* Day-of-week headers */}
      <div className="cal-month-header">
        {DAYS_SHORT.map(d => (
          <div key={d} className="cal-month-header__cell">{d}</div>
        ))}
      </div>

      {/* Month grid */}
      <div className="cal-month-grid">
        {monthGrid.map(({ date, isCurrentMonth, isToday: today }) => {
          const dateKey = getDateKey(date);
          const dayEvents = eventsByDate[dateKey] || [];
          const visible   = dayEvents.slice(0, MAX_VISIBLE);
          const overflow  = dayEvents.length - MAX_VISIBLE;

          return (
            <div
              key={dateKey}
              className={[
                'cal-month-cell',
                !isCurrentMonth  ? 'cal-month-cell--other-month' : '',
                today            ? 'cal-month-cell--today'        : '',
                dayEvents.length ? 'cal-month-cell--has-events'   : '',
              ].filter(Boolean).join(' ')}
              onClick={() => goToDay(date)}
            >
              <div className="cal-month-cell__header">
                <span className={`cal-month-cell__num ${today ? 'cal-month-cell__num--today' : ''}`}>
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="cal-month-cell__count">{dayEvents.length}</span>
                )}
              </div>

              <div className="cal-month-cell__events">
                {visible.map(ev => (
                  <MonthEventChip key={ev.id} interview={ev} onClick={onEventClick} />
                ))}
                {overflow > 0 && (
                  <button
                    className="cal-month-more"
                    onClick={(e) => { e.stopPropagation(); goToDay(date); }}
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

