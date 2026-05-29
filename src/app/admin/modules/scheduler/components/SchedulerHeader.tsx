"use client";

/**
 * SchedulerHeader.jsx
 * Toolbar: view toggle, date navigation, CTA, active tab switcher.
 * Keyboard shortcuts: T=today, W/D/M=view, ←/→=navigate
 */

import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, BarChart2, Calendar, Sun, Moon, HelpCircle } from 'lucide-react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';
import { formatWeekRange, getWeekDays, MONTHS } from '../utils/calendarUtils.js';

const VIEWS = [
  { id: 'day',   label: 'Day',   key: 'D' },
  { id: 'week',  label: 'Week',  key: 'W' },
  { id: 'month', label: 'Month', key: 'M' },
];

const formatHeaderDate = (view, date) => {
  if (view === 'week')  return formatWeekRange(getWeekDays(date));
  if (view === 'day')   return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (view === 'month') return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return '';
};

export default function SchedulerHeader({ scheduledCount, onHelpClick }) {
  const { state, dispatch } = useSchedulerContext();
  const { view, currentDate, activeTab, darkMode } = state;

  const navigate  = (dir) => dispatch({ type: ACTIONS.NAVIGATE_DATE, payload: dir });
  const goToToday = ()    => dispatch({ type: ACTIONS.GO_TO_TODAY });
  const setView   = (v)   => dispatch({ type: ACTIONS.SET_VIEW, payload: v });
  const setTab    = (t)   => dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: t });
  const openModal = ()    => dispatch({ type: ACTIONS.OPEN_MODAL, payload: {} });

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Don't fire when focused in input/select/textarea
    if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey) return;

    switch (e.key) {
      case 'T': case 't': goToToday(); break;
      case 'D': case 'd': setView('day'); break;
      case 'W': case 'w': setView('week'); break;
      case 'M': case 'm': setView('month'); break;
      case 'ArrowLeft':   navigate(-1); break;
      case 'ArrowRight':  navigate(1); break;
      case 'n': case 'N': openModal(); break;
      default: break;
    }
  }, [view]);  // eslint-disable-line

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="sched-header">
      {/* Left: Tab switcher */}
      <div className="sched-header__tabs">
        <button
          className={`sched-tab-btn ${activeTab === 'calendar' ? 'sched-tab-btn--active' : ''}`}
          onClick={() => setTab('calendar')}
        >
          <Calendar size={15} />
          Calendar
        </button>
        <button
          className={`sched-tab-btn ${activeTab === 'analytics' ? 'sched-tab-btn--active' : ''}`}
          onClick={() => setTab('analytics')}
        >
          <BarChart2 size={15} />
          Analytics
        </button>
      </div>

      {/* Center: Date navigation (only in calendar tab) */}
      {activeTab === 'calendar' && (
        <div className="sched-header__nav">
          <button className="sched-nav-btn" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <button className="sched-today-btn" onClick={goToToday}>
            Today
          </button>
          <button className="sched-nav-btn" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight size={18} />
          </button>
          <span className="sched-header__date-label" suppressHydrationWarning>
            {formatHeaderDate(view, currentDate)}
          </span>
        </div>
      )}

      {/* Right: View toggle + CTA */}
      <div className="sched-header__actions">
        {activeTab === 'calendar' && (
          <div className="sched-view-toggle" role="group" aria-label="Calendar view">
            {VIEWS.map(v => (
              <button
                key={v.id}
                className={`sched-view-btn ${view === v.id ? 'sched-view-btn--active' : ''}`}
                onClick={() => setView(v.id)}
                title={`${v.label} view (${v.key})`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="sched-header__utility-buttons" style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <button 
            className="sched-nav-btn" 
            onClick={() => dispatch({ type: ACTIONS.TOGGLE_THEME })}
            title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            aria-label="Toggle visual theme"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button 
            className="sched-nav-btn" 
            onClick={onHelpClick}
            title="Keyboard shortcuts help (?)"
            aria-label="Show keyboard shortcuts help panel"
          >
            <HelpCircle size={15} />
          </button>
        </div>

        <div className="sched-header__count">
          <span className="sched-count-badge">{scheduledCount}</span>
          scheduled
        </div>

        <button className="btn btn-primary sched-cta" onClick={openModal}>
          <Plus size={16} />
          Schedule Interview
        </button>
      </div>
    </div>
  );
}

