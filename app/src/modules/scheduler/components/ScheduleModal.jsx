/**
 * ScheduleModal.jsx
 * 4-step enterprise scheduling modal with stepper, validation, and animations.
 * Steps: 1=Candidate, 2=Panel, 3=Time & Place, 4=Review & Send
 */

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Search, Clock, Calendar, Video, MapPin, Loader2 } from 'lucide-react';
import { useSchedulerContext, ACTIONS } from '../store/schedulerReducer.js';
import { useScheduler, PANELISTS, INTERVIEW_TEMPLATES } from '../hooks/useScheduler.js';
import { useConflictDetection } from '../hooks/useConflictDetection.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { useAppContext } from '../../../context/AppContext.jsx';
import ConflictBanner from './ConflictBanner.jsx';
import { formatTime, formatDuration } from '../utils/calendarUtils.js';
import { PLATFORM_OPTIONS } from '../services/calendarProviders/index.js';

const STEPS = [
  { id: 1, label: 'Candidate',   short: '1' },
  { id: 2, label: 'Panel Setup', short: '2' },
  { id: 3, label: 'Time & Place',short: '3' },
  { id: 4, label: 'Review',      short: '4' },
];

const DURATION_OPTIONS = [
  { value: 30,  label: '30 minutes' },
  { value: 45,  label: '45 minutes' },
  { value: 60,  label: '1 hour' },
  { value: 90,  label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ currentStep }) {
  return (
    <div className="modal-stepper">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className={`stepper-step ${currentStep === step.id ? 'stepper-step--active' : ''} ${currentStep > step.id ? 'stepper-step--done' : ''}`}>
            <div className="stepper-step__circle">
              {currentStep > step.id ? <Check size={12} /> : step.short}
            </div>
            <span className="stepper-step__label">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`stepper-connector ${currentStep > step.id ? 'stepper-connector--done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Step 1: Candidate ────────────────────────────────────────────────────────

function StepCandidate({ formData, update }) {
  const { candidates } = useAppContext();
  const searchRef = useRef('');

  const filtered = useMemo(() => {
    const q = (formData._search || '').toLowerCase();
    return q.length < 2 ? candidates : candidates.filter(c =>
      c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [candidates, formData._search]);

  const selectCandidate = (c) => {
    update({
      candidateId:    c.id,
      candidateName:  c.name,
      candidateEmail: c.email,
      jobRole:        c.jobApplied || c.job_applied || '',
      _search:        c.name,
    });
  };

  return (
    <div className="modal-step">
      <div className="form-group">
        <label className="form-label">Search Candidate</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Name or email..."
            value={formData._search || ''}
            onChange={(e) => update({ _search: e.target.value, candidateId: '', candidateName: '' })}
            autoFocus
          />
        </div>
        {formData._search && !formData.candidateId && (
          <div className="modal-search-dropdown">
            {filtered.length === 0 ? (
              <div className="modal-search-empty">No candidates found</div>
            ) : (
              filtered.slice(0, 8).map(c => (
                <button key={c.id} className="modal-search-item" onClick={() => selectCandidate(c)}>
                  <div className="modal-search-item__avatar">{c.name?.[0] || '?'}</div>
                  <div className="modal-search-item__info">
                    <span className="modal-search-item__name">{c.name}</span>
                    <span className="modal-search-item__meta">{c.jobApplied || c.job_applied} · Score: {c.resumeScore || c.resume_score || '—'}</span>
                  </div>
                  {(c.resumeScore || c.resume_score) && (
                    <span className={`badge ${(c.resumeScore || c.resume_score) >= 80 ? 'badge-success' : 'badge-warning'}`}>
                      {c.resumeScore || c.resume_score}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {formData.candidateId && (
        <div className="modal-candidate-card">
          <div className="modal-candidate-card__avatar">{formData.candidateName?.[0]}</div>
          <div className="modal-candidate-card__info">
            <strong>{formData.candidateName}</strong>
            <span>{formData.candidateEmail}</span>
            <span className="modal-candidate-card__role">{formData.jobRole}</span>
          </div>
          <span className="badge badge-success">Selected</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Round</label>
          <select className="form-select" value={formData.round} onChange={e => update({ round: Number(e.target.value) })}>
            {[1, 2, 3, 4].map(r => (
              <option key={r} value={r}>{r === 4 ? 'Final Round' : `Round ${r}`}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Interview Template</label>
          <select className="form-select" value={formData.template} onChange={e => {
            const tpl = INTERVIEW_TEMPLATES.find(t => t.id === e.target.value);
            update({ template: e.target.value, duration: tpl?.defaultDuration || 60 });
          }}>
            {INTERVIEW_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Panel Setup ──────────────────────────────────────────────────────

function StepPanel({ formData, update, getPanelistStatus, currentDate }) {
  const toggle = (id) => {
    const ids = formData.panelistIds || [];
    update({ panelistIds: ids.includes(id) ? ids.filter(p => p !== id) : [...ids, id] });
  };

  const statusColors = { free: '#10b981', limited: '#f59e0b', busy: '#ef4444', blocked: '#94a3b8', weekend: '#94a3b8' };

  return (
    <div className="modal-step">
      <p className="modal-step__hint">Select one or more panelists. Availability shown for today.</p>
      <div className="modal-panelist-grid">
        {PANELISTS.map(p => {
          const selected  = (formData.panelistIds || []).includes(p.id);
          const avStatus  = getPanelistStatus(p.id, currentDate);
          const dotColor  = statusColors[avStatus] || statusColors.free;
          return (
            <button
              key={p.id}
              className={`modal-panelist-btn ${selected ? 'modal-panelist-btn--selected' : ''}`}
              onClick={() => toggle(p.id)}
              aria-pressed={selected}
            >
              <div className="modal-panelist-btn__avatar" style={{ backgroundColor: p.color }}>
                {p.avatar}
                <div className="modal-panelist-btn__status-dot" style={{ backgroundColor: dotColor }} />
              </div>
              <div className="modal-panelist-btn__info">
                <span className="modal-panelist-btn__name">{p.name}</span>
                <span className="modal-panelist-btn__role">{p.role}</span>
                <span className="modal-panelist-btn__avail" style={{ color: dotColor }}>
                  {avStatus === 'free' ? 'Available' : avStatus === 'limited' ? 'Limited' : avStatus === 'busy' ? 'Busy today' : 'Off today'}
                </span>
              </div>
              {selected && <div className="modal-panelist-btn__check"><Check size={14} /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Time & Place ─────────────────────────────────────────────────────

function StepTime({ formData, update, suggestions }) {
  return (
    <div className="modal-step">
      {suggestions.length > 0 && (
        <div className="form-group">
          <label className="form-label">Smart Suggestions</label>
          <div className="modal-suggestions">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className={`modal-suggestion-chip ${formData.date === s.dateKey && formData.time === s.time ? 'modal-suggestion-chip--active' : ''}`}
                onClick={() => update({ date: s.dateKey, time: s.time })}
              >
                {i === 0 ? '⭐ Best' : `Alt ${i}`}: {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label"><Calendar size={13} style={{display:'inline',marginRight:'4px'}} />Date</label>
          <input type="date" className="form-input" value={formData.date} onChange={e => update({ date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label"><Clock size={13} style={{display:'inline',marginRight:'4px'}} />Time</label>
          <input type="time" className="form-input" step="900" value={formData.time} onChange={e => update({ time: e.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Duration</label>
        <div className="modal-duration-grid">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`modal-duration-btn ${formData.duration === opt.value ? 'modal-duration-btn--active' : ''}`}
              onClick={() => update({ duration: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Platform</label>
        <div className="modal-platform-grid">
          {PLATFORM_OPTIONS.map(p => (
            <button
              key={p.id}
              className={`modal-platform-btn ${formData.platform === p.id ? 'modal-platform-btn--active' : ''}`}
              style={{ '--platform-color': p.color }}
              onClick={() => update({ platform: p.id })}
            >
              <div className="modal-platform-btn__dot" style={{ backgroundColor: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes / Agenda</label>
        <textarea
          className="form-textarea"
          rows={3}
          placeholder="Topics to cover, preparation notes..."
          value={formData.notes}
          onChange={e => update({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function StepReview({ formData }) {
  const panelists = (formData.panelistIds || []).map(id => PANELISTS.find(p => p.id === id)).filter(Boolean);
  const platform  = PLATFORM_OPTIONS.find(p => p.id === formData.platform);

  return (
    <div className="modal-step">
      <div className="modal-review-card">
        <div className="modal-review-row">
          <span className="modal-review-label">Candidate</span>
          <span className="modal-review-value">{formData.candidateName || '—'}</span>
        </div>
        <div className="modal-review-row">
          <span className="modal-review-label">Job Role</span>
          <span className="modal-review-value">{formData.jobRole || '—'}</span>
        </div>
        <div className="modal-review-row">
          <span className="modal-review-label">Round</span>
          <span className="modal-review-value">Round {formData.round}</span>
        </div>
        <div className="modal-review-row">
          <span className="modal-review-label">Type</span>
          <span className="modal-review-value">{INTERVIEW_TEMPLATES.find(t => t.id === formData.template)?.label}</span>
        </div>
        <div className="modal-review-row">
          <span className="modal-review-label">Panelists</span>
          <div className="modal-review-panelists">
            {panelists.map(p => (
              <span key={p.id} className="modal-review-panelist-chip" style={{ backgroundColor: p.color + '22', color: p.color }}>
                {p.avatar} {p.name}
              </span>
            ))}
          </div>
        </div>
        <div className="modal-review-row">
          <span className="modal-review-label">Date & Time</span>
          <span className="modal-review-value">{formData.date} · {formatTime(formData.time)} ({formatDuration(formData.duration)})</span>
        </div>
        <div className="modal-review-row">
          <span className="modal-review-label">Platform</span>
          <span className="modal-review-value" style={{ color: platform?.color }}>{platform?.label}</span>
        </div>
        {formData.notes && (
          <div className="modal-review-row modal-review-row--full">
            <span className="modal-review-label">Notes</span>
            <span className="modal-review-value">{formData.notes}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Notifications</label>
                  <div className="modal-notify-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {[
              { key: 'notifyEmail', label: 'Email invite' },
              { key: 'notifyTeams', label: 'Teams message' },
              { key: 'notifySlack', label: 'Slack DM' },
            ].map(n => (
              <label key={n.key} className="modal-notify-check" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" checked={formData[n.key]} onChange={e => update({ [n.key]: e.target.checked })} readOnly={false} />
                {n.label}
              </label>
            ))}
          </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ScheduleModal() {
  const { state, dispatch } = useSchedulerContext();
  const { scheduleInterview } = useScheduler();
  const { conflicts, hasHard } = useConflictDetection();
  const { suggestions, getPanelistStatus } = useAvailability();
  const { modal } = state;

  const update   = useCallback((changes) => dispatch({ type: ACTIONS.UPDATE_MODAL_FORM, payload: changes }), [dispatch]);
  const setStep  = useCallback((s)       => dispatch({ type: ACTIONS.SET_MODAL_STEP, payload: s }), [dispatch]);
  const close    = useCallback(()        => dispatch({ type: ACTIONS.CLOSE_MODAL }), [dispatch]);

  // Step validation
  const canProceed = useMemo(() => {
    const { formData, step } = modal;
    if (step === 1) return !!formData.candidateId;
    if (step === 2) return (formData.panelistIds?.length || 0) > 0;
    if (step === 3) return !!(formData.date && formData.time && !hasHard);
    return true;
  }, [modal, hasHard]);

  const handleSubmit = useCallback(async () => {
    try {
      await scheduleInterview(modal.formData);
    } catch {}
  }, [scheduleInterview, modal.formData]);

  const handleNext = useCallback(() => {
    if (modal.step < 4) setStep(modal.step + 1);
    else handleSubmit();
  }, [modal.step, setStep, handleSubmit]);

  // Escape to close
  useEffect(() => {
    if (!modal.open) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal.open, close]);

  // Keyboard navigation: Enter to continue
  useEffect(() => {
    if (!modal.open) return;
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
        if (canProceed) {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, [modal.open, canProceed, handleNext]);

  if (!modal.open) return null;

  const { formData, step, loading } = modal;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Schedule Interview" onClick={close}>
      <div className="modal-container sched-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Schedule Interview</h2>
            <p className="modal-subtitle">Create a new technical interview</p>
          </div>
          <button className="modal-close-btn" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="modal-stepper-wrapper">
          <Stepper currentStep={step} />
        </div>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div style={{ padding: '0 1.5rem' }}>
            <ConflictBanner conflicts={conflicts} onUseSuggestion={(time) => update({ time })} />
          </div>
        )}

        {/* Step content */}
        <div className="modal-body">
          <div className="animate-fade-in" key={step}>
            {step === 1 && <StepCandidate formData={formData} update={update} />}
            {step === 2 && <StepPanel formData={formData} update={update} getPanelistStatus={getPanelistStatus} currentDate={state.currentDate} />}
            {step === 3 && <StepTime formData={formData} update={update} suggestions={suggestions} />}
            {step === 4 && <StepReview formData={formData} />}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={step === 1 ? close : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : <><ChevronLeft size={14} /> Back</>}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="modal-step-counter">{step} of {STEPS.length}</span>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed || loading}
            >
              {loading ? (
                <><Loader2 size={14} className="spin" /> Scheduling...</>
              ) : step === 4 ? (
                <><Check size={14} /> Confirm & Schedule</>
              ) : (
                <>Next <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
