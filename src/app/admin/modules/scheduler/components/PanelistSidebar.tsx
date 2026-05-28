"use client";

/**
 * PanelistSidebar.jsx
 * Panelist availability panel with workload bars, availability dots,
 * and click-to-highlight on calendar.
 */

import React, { memo } from 'react';
import { Users, Clock } from 'lucide-react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { PANELISTS } from '../hooks/useScheduler.js';
import { getWeekDays, getDateKey, formatDateShort } from '../utils/calendarUtils.js';

const STATUS_COLORS = {
  free:    '#10b981',
  limited: '#f59e0b',
  busy:    '#ef4444',
  blocked: '#cbd5e1',
};

const STATUS_LABELS = {
  free:    'Available',
  limited: 'Limited',
  busy:    'Busy',
  blocked: 'Off',
};

// ─── Availability Dot ─────────────────────────────────────────────────────────

const AvailDot = memo(({ status }) => (
  <div
    className="panelist-avail-dot"
    style={{ backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.free }}
    title={STATUS_LABELS[status]}
  />
));
AvailDot.displayName = 'AvailDot';

// ─── Weekly Dots Row (Mon-Fri) ─────────────────────────────────────────────────

const WeeklyDots = memo(({ panelistId, weekDays, getPanelistStatus }) => (
  <div className="panelist-week-dots">
    {weekDays.slice(0, 5).map(day => {
      const status = getPanelistStatus(panelistId, day);
      return (
        <div key={getDateKey(day)} className="panelist-week-dot-item" title={formatDateShort(day)}>
          <AvailDot status={status} />
          <span className="panelist-week-dot-label">{['M','T','W','T','F'][day.getDay() - 1]}</span>
        </div>
      );
    })}
  </div>
));
WeeklyDots.displayName = 'WeeklyDots';

// ─── Workload Bar ─────────────────────────────────────────────────────────────

const WorkloadBar = memo(({ percent, scheduledMinutes }) => {
  const color = percent >= 70 ? '#ef4444' : percent >= 40 ? '#f59e0b' : '#10b981';
  const hours = Math.floor(scheduledMinutes / 60);
  const mins  = scheduledMinutes % 60;
  const label = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

  return (
    <div className="panelist-workload">
      <div className="panelist-workload__bar-track">
        <div
          className="panelist-workload__bar-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="panelist-workload__label" style={{ color }}>
        {label}
      </span>
    </div>
  );
});
WorkloadBar.displayName = 'WorkloadBar';

// ─── Panelist Row ──────────────────────────────────────────────────────────────

const PanelistRow = memo(({ panelist, workload, weekDays, getPanelistStatus, isSelected, onSelect }) => (
  <button
    className={`panelist-row ${isSelected ? 'panelist-row--selected' : ''}`}
    onClick={() => onSelect(panelist.id)}
    aria-pressed={isSelected}
    title={`Click to highlight ${panelist.name}'s interviews`}
  >
    <div className="panelist-row__left">
      <div
        className="panelist-avatar"
        style={{ backgroundColor: panelist.color }}
      >
        {panelist.avatar}
      </div>
      <div className="panelist-row__info">
        <span className="panelist-row__name">{panelist.name}</span>
        <span className="panelist-row__role">{panelist.role}</span>
        <WorkloadBar
          percent={workload.busyPercent}
          scheduledMinutes={workload.scheduledMinutes}
        />
      </div>
    </div>
    <WeeklyDots panelistId={panelist.id} weekDays={weekDays} getPanelistStatus={getPanelistStatus} />
  </button>
));
PanelistRow.displayName = 'PanelistRow';

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function PanelistSidebar() {
  const { state, dispatch } = useSchedulerContext();
  const { workloads, getPanelistStatus } = useAvailability();
  const { currentDate, selectedPanelistId } = state;

  const weekDays = getWeekDays(currentDate);

  const totalScheduled = state.interviews.filter(iv => iv.status === 'scheduled').length;

  return (
    <aside className="panelist-sidebar">
      <div className="panelist-sidebar__header">
        <div className="panelist-sidebar__title">
          <Users size={15} />
          Panel Availability
        </div>
        <div className="panelist-sidebar__week">
          <Clock size={12} />
          This week
        </div>
      </div>

      {/* Legend */}
      <div className="panelist-legend">
        {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'blocked').map(([status, color]) => (
          <div key={status} className="panelist-legend-item">
            <div className="panelist-legend-dot" style={{ backgroundColor: color }} />
            <span>{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      {/* Panelist list */}
      <div className="panelist-list">
        {PANELISTS.map(panelist => (
          <PanelistRow
            key={panelist.id}
            panelist={panelist}
            workload={workloads[panelist.id] || { busyPercent: 0, scheduledMinutes: 0 }}
            weekDays={weekDays}
            getPanelistStatus={getPanelistStatus}
            isSelected={selectedPanelistId === panelist.id}
            onSelect={(id) => dispatch({ type: ACTIONS.SET_SELECTED_PANELIST, payload: id })}
          />
        ))}
      </div>

      {/* Summary footer */}
      <div className="panelist-sidebar__footer">
        <div className="panelist-sidebar__stat">
          <span className="panelist-sidebar__stat-num">{totalScheduled}</span>
          <span className="panelist-sidebar__stat-label">interviews this week</span>
        </div>
        <div className="panelist-sidebar__note">
          Working hours: 9 AM – 6 PM IST<br />
          Lunch: 1 – 2 PM · Buffer: 15 min
        </div>
      </div>
    </aside>
  );
}

