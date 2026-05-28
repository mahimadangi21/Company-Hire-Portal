"use client";

/**
 * PanelistSidebar.jsx
 * Panelist availability panel with workload bars, availability dots,
 * and click-to-highlight on calendar.
 */

import React, { memo, useState } from 'react';
import { Users, Clock, UserPlus, Trash2, X } from 'lucide-react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';
import { useAvailability } from '../hooks/useAvailability.js';
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

const PanelistRow = memo(({ panelist, workload, weekDays, getPanelistStatus, isSelected, onSelect, onDelete }) => (
  <div
    className={`panelist-row ${isSelected ? 'panelist-row--selected' : ''}`}
    onClick={() => onSelect(panelist.id)}
    role="button"
    tabIndex={0}
    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}
    aria-pressed={isSelected}
    title={`Click to highlight ${panelist.name}'s interviews`}
    onKeyDown={(e) => e.key === 'Enter' && onSelect(panelist.id)}
  >
    <div className="panelist-row__left" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
      <div
        className="panelist-avatar"
        style={{ backgroundColor: panelist.color, flexShrink: 0 }}
      >
        {panelist.avatar}
      </div>
      <div className="panelist-row__info" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span className="panelist-row__name" style={{ fontWeight: 600 }}>{panelist.name}</span>
        <span className="panelist-row__role" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{panelist.role}</span>
        <WorkloadBar
          percent={workload.busyPercent}
          scheduledMinutes={workload.scheduledMinutes}
        />
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
      <WeeklyDots panelistId={panelist.id} weekDays={weekDays} getPanelistStatus={getPanelistStatus} />
      <button
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          opacity: 0.6,
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="hover:opacity-100 hover:bg-red-50"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(panelist.id, panelist.name);
        }}
        title={`Delete ${panelist.name}`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  </div>
));
PanelistRow.displayName = 'PanelistRow';

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function PanelistSidebar() {
  const { state, dispatch } = useSchedulerContext();
  const { workloads, getPanelistStatus } = useAvailability();
  const { currentDate, selectedPanelistId, panelists } = state;

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const weekDays = getWeekDays(currentDate);

  const totalScheduled = state.interviews.filter(iv => iv.status === 'scheduled').length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    const initials = name
      .trim()
      .split(/\s+/)
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const colors = ['#0E2D7B', '#7DBA00', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    dispatch({
      type: ACTIONS.ADD_PANELIST,
      payload: {
        id: 'p_' + Date.now(),
        name: name.trim(),
        role: role.trim(),
        avatar: initials || '?',
        color: randomColor,
      }
    });

    setName('');
    setRole('');
    setShowAddForm(false);
  };

  return (
    <aside className="panelist-sidebar">
      <div className="panelist-sidebar__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="panelist-sidebar__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={15} />
          Panel Availability
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'var(--brand-green)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          className="hover:bg-opacity-90"
        >
          <UserPlus size={12} /> Add
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', margin: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--gray-50)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-navy)' }}>New Panelist</span>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            placeholder="Full Name (e.g. Bob Martin)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            placeholder="Role (e.g. QA Automation)"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem', width: '100%', marginTop: '4px' }}>
            Save Panelist
          </button>
        </form>
      )}

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
        {panelists.map(panelist => (
          <PanelistRow
            key={panelist.id}
            panelist={panelist}
            workload={workloads[panelist.id] || { busyPercent: 0, scheduledMinutes: 0 }}
            weekDays={weekDays}
            getPanelistStatus={getPanelistStatus}
            isSelected={selectedPanelistId === panelist.id}
            onSelect={(id) => dispatch({ type: ACTIONS.SET_SELECTED_PANELIST, payload: id })}
            onDelete={(id, name) => {
              if (window.confirm(`Are you sure you want to remove ${name} from the panel?`)) {
                dispatch({ type: ACTIONS.REMOVE_PANELIST, payload: id });
              }
            }}
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
