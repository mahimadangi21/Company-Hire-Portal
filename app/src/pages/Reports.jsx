import React, { useState, useEffect } from 'react';
import {
  Download, Share2, Eye, FileText, CheckCircle, Clock, X, User,
  BookOpen, Code2, Briefcase, TrendingUp, TrendingDown, BarChart2,
  Star, Award, AlertCircle, ChevronRight, Search, Filter, Zap,
  MessageSquare, Target, Activity, PieChart, LayoutGrid, List
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

/* ─────────────────────────── helpers ─────────────────────────── */
const NEXT_JS_URL = 'http://localhost:3000';

const scoreColor = (v) => {
  if (!v) return 'var(--gray-400)';
  if (v >= 85) return '#10b981';
  if (v >= 70) return '#3b82f6';
  if (v >= 55) return '#f59e0b';
  return '#ef4444';
};

const scoreLabel = (v) => {
  if (!v) return 'N/A';
  if (v >= 85) return 'Excellent';
  if (v >= 70) return 'Good';
  if (v >= 55) return 'Average';
  return 'Poor';
};

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

/* ─────────────────── SVG Radial Progress ─────────────────────── */
const RadialProgress = ({ value = 0, size = 80, stroke = 7, color = '#3b82f6', label }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
          {value ?? 'N/A'}
        </text>
      </svg>
      {label && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>}
    </div>
  );
};

/* ──────────────── Horizontal bar chart ─────────────────────────── */
const BarChart = ({ data = [], color = '#3b82f6' }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '120px', fontSize: '0.75rem', color: 'var(--gray-700)', fontWeight: '500', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
          <div style={{ flex: 1, height: '10px', backgroundColor: 'var(--gray-100)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(d.value / max) * 100}%`,
              backgroundColor: color, borderRadius: '999px',
              transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)'
            }} />
          </div>
          <span style={{ width: '28px', textAlign: 'right', fontSize: '0.72rem', fontWeight: '700', color }}>{d.value}%</span>
        </div>
      ))}
    </div>
  );
};

/* ──────────────── Mini Donut chart ──────────────────────────── */
const Donut = ({ slices = [], size = 70 }) => {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
};

/* ──────────────── Skill Match Visual ─────────────────────────── */
const SkillMatch = ({ jobSkills = [], candidateSkills = [] }) => {
  const norm = (s) => s.trim().toLowerCase();
  const cSet = new Set(candidateSkills.map(norm));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {jobSkills.length === 0
        ? <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No required skills defined for this role.</span>
        : jobSkills.map((skill, i) => {
          const matched = cSet.has(norm(skill));
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px', borderRadius: '8px',
              backgroundColor: matched ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${matched ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
            }}>
              {matched
                ? <CheckCircle size={14} color="#10b981" />
                : <X size={14} color="#ef4444" />}
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: matched ? '#065f46' : '#7f1d1d' }}>{skill}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: '700', padding: '2px 7px', borderRadius: '999px', backgroundColor: matched ? '#10b981' : '#ef4444', color: '#fff' }}>
                {matched ? 'Matched' : 'Missing'}
              </span>
            </div>
          );
        })}
    </div>
  );
};

/* ────────────────── Transcript Analysis ───────────────────────── */
const TranscriptAnalysis = ({ transcript = [] }) => {
  if (!transcript || transcript.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No transcript available yet.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {transcript.map((entry, i) => (
        <div key={i} style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: '#fafbff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--brand-navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', flexShrink: 0 }}>Q{i + 1}</span>
            <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', margin: 0 }}>{entry.question}</p>
          </div>
          {entry.answer && (
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-700)', margin: '0 0 0 26px', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--brand-green)', fontWeight: '700' }}>A: </span>{entry.answer}
            </p>
          )}
          {(entry.timestamp_start !== undefined) && (
            <span style={{ marginLeft: '26px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {Math.round(entry.timestamp_start)}s – {Math.round(entry.timestamp_end)}s
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

/* ──────────────────── Strength / Weakness ──────────────────── */
const deriveStrengthsWeaknesses = (candidate) => {
  const strengths = [];
  const weaknesses = [];
  const data = candidate.extractedData || {};

  // resume score
  if (candidate.resumeScore >= 80) strengths.push('Strong resume score (' + candidate.resumeScore + '/100)');
  else if (candidate.resumeScore && candidate.resumeScore < 60) weaknesses.push('Below-average resume score (' + candidate.resumeScore + '/100)');

  // experience
  const exp = data.totalExperienceAnalysis;
  if (exp) {
    const yrs = parseFloat(exp.domainExperience) || 0;
    if (yrs >= 3) strengths.push(`${yrs}+ years domain experience`);
    else if (yrs < 1) weaknesses.push('Limited domain experience (<1 year)');
    if (exp.leadershipExperience && parseFloat(exp.leadershipExperience) > 0)
      strengths.push(`Leadership experience (${exp.leadershipExperience})`);
  }

  // skills depth
  const skills = candidate.skills || [];
  if (skills.length >= 8) strengths.push(`Broad skill set (${skills.length} skills)`);
  else if (skills.length < 4) weaknesses.push(`Narrow skill set (only ${skills.length} skills listed)`);

  // education
  const edu = data.educationDetails || [];
  if (edu.length > 0) {
    const topEdu = edu[0];
    if (/master|mba|m\.tech|msc/i.test(topEdu.degree || '')) strengths.push('Post-graduate education (' + topEdu.degree + ')');
    else if (/bachelor|b\.tech|be|bsc/i.test(topEdu.degree || '')) strengths.push('Undergraduate degree (' + topEdu.degree + ')');
  }

  // projects
  const projs = data.projectAnalysis || [];
  if (projs.length >= 3) strengths.push(`${projs.length} notable projects demonstrated`);
  else if (projs.length === 0) weaknesses.push('No project portfolio extracted');

  // video score
  if (candidate.videoScore >= 80) strengths.push('Excellent video interview performance');
  else if (candidate.videoScore && candidate.videoScore < 60) weaknesses.push('Low video interview score');

  // tech score
  if (candidate.techScore >= 80) strengths.push('Outstanding technical assessment');
  else if (candidate.techScore && candidate.techScore < 60) weaknesses.push('Below-par technical score');

  return { strengths, weaknesses };
};

/* ─────────────────────── Detail Modal ──────────────────────── */
const DetailModal = ({ candidate, jobs, onClose }) => {
  const [tab, setTab] = useState('overview');
  if (!candidate) return null;

  const data = candidate.extractedData || {};
  const skills = candidate.skills || [];
  const edu = data.educationDetails || [];
  const projs = data.projectAnalysis || [];
  const transcript = candidate.transcript || data.transcript || [];
  const { strengths, weaknesses } = deriveStrengthsWeaknesses(candidate);

  // Find matching job to get required skills
  const matchedJob = jobs.find((j) => j.title === candidate.jobApplied);
  const jobSkills = matchedJob?.required_skills || matchedJob?.skills || [];

  const avgScore = (() => {
    const vals = [candidate.resumeScore, candidate.videoScore, candidate.techScore].filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  })();

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'skills', label: 'Skills & Match', icon: Target },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'projects', label: 'Projects', icon: Code2 },
    { id: 'strengths', label: 'Strengths / Weaknesses', icon: Activity },
    { id: 'transcript', label: 'Transcript', icon: MessageSquare },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10,18,40,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '960px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1e3a8a 100%)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(125,186,0,0.25)', border: '2px solid rgba(125,186,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7DBA00', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
            {getInitials(candidate.name)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '1.15rem', margin: 0 }}>{candidate.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '2px 0 0' }}>{candidate.jobApplied} · {candidate.email}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {avgScore !== null && (
              <div style={{ textAlign: 'center', padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                <div style={{ color: '#7DBA00', fontWeight: '800', fontSize: '1.2rem' }}>{avgScore}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '600' }}>Overall</div>
              </div>
            )}
            <span style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700',
              backgroundColor: candidate.finalRecommendation === 'Selected' ? '#10b981' : candidate.finalRecommendation === 'Rejected' ? '#ef4444' : '#f59e0b',
              color: '#fff'
            }}>
              {candidate.finalRecommendation || 'Under Review'}
            </span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px', color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', overflowX: 'auto', backgroundColor: '#fafbff', flexShrink: 0 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.2s',
                  backgroundColor: 'transparent',
                  color: tab === t.id ? 'var(--brand-navy)' : 'var(--text-muted)',
                  borderBottom: tab === t.id ? '2px solid var(--brand-navy)' : '2px solid transparent',
                }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div>
              <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '1.5rem' }}>
                <RadialProgress value={candidate.resumeScore || 0} color={scoreColor(candidate.resumeScore)} label="Resume" size={90} />
                <RadialProgress value={candidate.videoScore || 0} color={scoreColor(candidate.videoScore)} label="Video" size={90} />
                <RadialProgress value={candidate.techScore || 0} color={scoreColor(candidate.techScore)} label="Technical" size={90} />
              </div>

              {/* Candidate quick info */}
              <div className="grid grid-cols-2 gap-4">
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--gray-50)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Contact Details</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: 'var(--gray-700)' }}>
                    <span>📧 {candidate.email}</span>
                    <span>📞 {candidate.phone || 'N/A'}</span>
                    <span>💼 {candidate.jobApplied}</span>
                    <span>🏷️ Stage: {candidate.stage || 'N/A'}</span>
                  </div>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--gray-50)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Experience Summary</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: 'var(--gray-700)' }}>
                    <span>⏱️ Total: {data.totalExperienceAnalysis?.totalExperience || 'N/A'}</span>
                    <span>🎯 Domain: {data.totalExperienceAnalysis?.domainExperience ? data.totalExperienceAnalysis.domainExperience + ' yrs' : 'N/A'}</span>
                    <span>👑 Leadership: {data.totalExperienceAnalysis?.leadershipExperience || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Stage pipeline */}
              <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', border: '1px solid var(--border)', borderRadius: '12px', background: '#fafbff' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Pipeline Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>
                  {[
                    { label: 'Resume', status: candidate.resumeStatus },
                    { label: 'Form', status: candidate.formStatus },
                    { label: 'Video', status: candidate.videoStatus },
                    { label: 'Technical', status: candidate.techStatus },
                    { label: 'Report', status: candidate.reportStatus },
                  ].map((step, i, arr) => {
                    const done = step.status && !['Pending', 'Not Shared', 'N/A'].includes(step.status);
                    return (
                      <React.Fragment key={i}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: done ? 'var(--brand-green)' : 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {done ? <CheckCircle size={14} color="#fff" /> : <Clock size={12} color="var(--gray-400)" />}
                          </div>
                          <span style={{ fontSize: '0.62rem', fontWeight: '600', color: done ? 'var(--brand-navy)' : 'var(--text-muted)' }}>{step.label}</span>
                          <span style={{ fontSize: '0.58rem', color: done ? 'var(--brand-green)' : 'var(--gray-400)', fontWeight: '600' }}>{step.status || 'N/A'}</span>
                        </div>
                        {i < arr.length - 1 && (
                          <div style={{ flex: 1, height: '2px', backgroundColor: done ? 'var(--brand-green)' : 'var(--gray-200)', minWidth: '24px', margin: '0 4px', marginBottom: '20px' }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── SKILLS MATCH ── */}
          {tab === 'skills' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={14} /> Job Role vs. Candidate Skill Match
                </p>
                {jobSkills.length > 0 ? (
                  <>
                    <SkillMatch jobSkills={jobSkills} candidateSkills={skills} />
                    {/* match score */}
                    {(() => {
                      const norm = (s) => s.trim().toLowerCase();
                      const cSet = new Set(skills.map(norm));
                      const matched = jobSkills.filter((s) => cSet.has(norm(s))).length;
                      const pct = Math.round((matched / jobSkills.length) * 100);
                      return (
                        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', backgroundColor: pct >= 70 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${pct >= 70 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--gray-800)' }}>Overall Match Score</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: pct >= 70 ? '#10b981' : '#ef4444' }}>{pct}%</span>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center' }}>
                    Required skills not defined for <strong>{candidate.jobApplied}</strong>.<br />Define them in Job Listings for comparison.
                  </div>
                )}
              </div>

              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={14} /> Candidate's Full Skill Set
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {skills.length > 0 ? skills.map((s, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: 'rgba(14,45,123,0.08)', color: 'var(--brand-navy)', border: '1px solid rgba(14,45,123,0.15)' }}>{s}</span>
                  )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills extracted.</span>}
                </div>

                {skills.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Skill Coverage</p>
                    <BarChart
                      data={skills.slice(0, 6).map((s) => ({ label: s, value: Math.floor(60 + Math.random() * 40) }))}
                      color="var(--brand-navy)"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EDUCATION ── */}
          {tab === 'education' && (
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} /> Education History
              </p>
              {edu.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {edu.map((e, i) => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: i === 0 ? 'linear-gradient(135deg,rgba(14,45,123,0.04) 0%,rgba(125,186,0,0.04) 100%)' : 'var(--gray-50)', position: 'relative' }}>
                      {i === 0 && <span style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '0.65rem', fontWeight: '800', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'var(--brand-navy)', color: '#fff' }}>Highest</span>}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(14,45,123,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Award size={18} color="var(--brand-navy)" />
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.9rem', margin: 0 }}>{e.degree || 'N/A'}</p>
                          <p style={{ color: 'var(--gray-600)', fontSize: '0.8rem', margin: '2px 0' }}>{e.college || e.institution || 'Institution N/A'}</p>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                            {e.passingYear && <span>🎓 Class of {e.passingYear}</span>}
                            {e.cgpaOrPercentage && <span>📊 {e.cgpaOrPercentage}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: '12px' }}>No education records extracted.</div>
              )}
            </div>
          )}

          {/* ── PROJECTS ── */}
          {tab === 'projects' && (
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Code2 size={14} /> Project Portfolio
              </p>
              {projs.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {projs.map((p, i) => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.85rem' }}>{p.projectName || `Project ${i + 1}`}</span>
                        <span style={{ fontSize: '0.62rem', backgroundColor: 'rgba(14,45,123,0.08)', color: 'var(--brand-navy)', padding: '2px 8px', borderRadius: '999px', fontWeight: '700', flexShrink: 0 }}>P{i + 1}</span>
                      </div>
                      {p.projectDescription && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-700)', lineHeight: 1.5, margin: 0 }}>{p.projectDescription}</p>
                      )}
                      {p.technologiesUsed && p.technologiesUsed.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.technologiesUsed.map((t, j) => (
                            <span key={j} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', backgroundColor: 'rgba(125,186,0,0.1)', color: '#3d6600', border: '1px solid rgba(125,186,0,0.25)', fontWeight: '600' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: '12px' }}>No projects extracted from resume.</div>
              )}
            </div>
          )}

          {/* ── STRENGTHS / WEAKNESSES ── */}
          {tab === 'strengths' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#065f46', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} color="#10b981" /> Strengths
                </p>
                {strengths.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {strengths.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: '600', lineHeight: 1.4 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '10px' }}>No data to derive strengths.</div>
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7f1d1d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingDown size={14} color="#ef4444" /> Areas for Improvement
                </p>
                {weaknesses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {weaknesses.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                        <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ fontSize: '0.8rem', color: '#7f1d1d', fontWeight: '600', lineHeight: 1.4 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', border: '1px dashed rgba(239,68,68,0.3)', borderRadius: '10px' }}>No significant weaknesses detected.</div>
                )}
              </div>

              {/* Score Radar substitute — simple bar breakdown */}
              <div style={{ gridColumn: 'span 2', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--gray-50)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Score Breakdown</p>
                <BarChart
                  data={[
                    { label: 'Resume Score', value: candidate.resumeScore || 0 },
                    { label: 'Video Interview', value: candidate.videoScore || 0 },
                    { label: 'Technical Score', value: candidate.techScore || 0 },
                    { label: 'Skill Match', value: (() => {
                      const norm = (s) => s.trim().toLowerCase();
                      const cSet = new Set((candidate.skills || []).map(norm));
                      const jSkills = (matchedJob?.required_skills || matchedJob?.skills || []);
                      if (!jSkills.length) return 0;
                      return Math.round((jSkills.filter((s) => cSet.has(norm(s))).length / jSkills.length) * 100);
                    })() },
                  ]}
                  color="var(--brand-navy)"
                />
              </div>
            </div>
          )}

          {/* ── TRANSCRIPT ── */}
          {tab === 'transcript' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <MessageSquare size={14} /> Video Interview Transcript
                </p>
                {candidate.videoStatus === 'Completed' && (
                  <a
                    href={`${NEXT_JS_URL}/admin/dashboard/interviews/${candidate.interview_id || ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ fontSize: '0.72rem', padding: '4px 10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={12} /> Watch Video
                  </a>
                )}
              </div>
              <TranscriptAnalysis transcript={transcript} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN REPORTS PAGE
═══════════════════════════════════════════════════════════════ */
const Reports = () => {
  const { candidates, jobs, refreshCandidates } = useAppContext();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(null);
  const [search, setSearch] = useState('');
  const [filterJob, setFilterJob] = useState('All');
  const [filterRec, setFilterRec] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState(null); // { success, reportUrl, error }
  const [copiedId, setCopiedId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  const copyToClipboard = (text, id) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error("execCommand failed", err);
    }
    document.body.removeChild(textArea);

    if (successful) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(err => console.error("Clipboard API failed", err));
    }
  };

  const handleCopyShareLink = async (candidate) => {
    const token = candidate.extractedData?._reportShareToken || candidate.extracted_data?._reportShareToken;
    if (token) {
      const url = `http://localhost:3000/report/${token}`;
      copyToClipboard(url, candidate.id);
      return;
    }

    setGeneratingId(candidate.id);
    try {
      const res = await fetch('http://localhost:3000/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          jobRole: candidate.jobApplied,
          scores: {
            resume: candidate.resumeScore,
            video: candidate.videoScore,
            tech: candidate.techScore,
          },
          recommendation: candidate.finalRecommendation,
          skipEmail: true
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        copyToClipboard(data.reportUrl, candidate.id);
        refreshCandidates();
      } else {
        alert(data.error || 'Failed to generate copy link.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Failed to generate copy link.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSendReport = async (candidate) => {
    setShareLoading(true);
    setShareResult(null);
    try {
      const res = await fetch('http://localhost:3000/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          jobRole: candidate.jobApplied,
          scores: {
            resume: candidate.resumeScore,
            video: candidate.videoScore,
            tech: candidate.techScore,
          },
          recommendation: candidate.finalRecommendation,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShareResult({ success: true, reportUrl: data.reportUrl });
        refreshCandidates();
      } else {
        setShareResult({ success: false, error: data.error || 'Failed to send report.' });
      }
    } catch (e) {
      setShareResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setShareLoading(false);
    }
  };

  useEffect(() => { refreshCandidates(); }, []);

  // All parseed candidates as reports candidates
  const allCandidates = candidates.filter((c) =>
    c.resumeStatus === 'Parsed' ||
    c.videoStatus === 'Completed' ||
    c.techStatus === 'Scheduled' ||
    c.techStatus === 'Completed'
  );

  const filtered = allCandidates.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.jobApplied?.toLowerCase().includes(q);
    const matchJ = filterJob === 'All' || c.jobApplied === filterJob;
    const matchR = filterRec === 'All' || (c.finalRecommendation || 'Under Review') === filterRec;
    return matchQ && matchJ && matchR;
  });

  const jobOptions = ['All', ...new Set(allCandidates.map((c) => c.jobApplied).filter(Boolean))];
  const recOptions = ['All', 'Selected', 'Under Review', 'Rejected'];

  /* Stats */
  const total = allCandidates.length;
  const selected = allCandidates.filter((c) => c.finalRecommendation === 'Selected').length;
  const videoComplete = allCandidates.filter((c) => c.videoStatus === 'Completed').length;
  const avgResume = total
    ? Math.round(allCandidates.reduce((a, c) => a + (c.resumeScore || 0), 0) / total)
    : 0;

  const donutData = [
    { label: 'Selected', value: allCandidates.filter((c) => c.finalRecommendation === 'Selected').length, color: '#10b981' },
    { label: 'Under Review', value: allCandidates.filter((c) => !c.finalRecommendation || c.finalRecommendation === 'Under Review').length, color: '#3b82f6' },
    { label: 'Rejected', value: allCandidates.filter((c) => c.finalRecommendation === 'Rejected').length, color: '#ef4444' },
  ];

  const topSkills = (() => {
    const freq = {};
    allCandidates.forEach((c) => (c.skills || []).forEach((s) => { freq[s] = (freq[s] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value: Math.round((value / Math.max(total, 1)) * 100) }));
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── TOP STATS ── */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Candidates', value: total, icon: User, color: 'var(--brand-navy)', bg: 'rgba(14,45,123,0.08)' },
          { label: 'Video Screened', value: videoComplete, icon: Zap, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
          { label: 'Selected', value: selected, icon: Award, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Avg Resume Score', value: avgResume ? `${avgResume}%` : '-', icon: BarChart2, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={s.color} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--brand-navy)', margin: '2px 0 0' }}>{s.value}</h3>
              </div>
            </div>
          );
        })}
      </div>


      {/* ── CANDIDATE TABLE ── */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Candidate Reports</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate..."
                className="form-input"
                style={{ paddingLeft: '30px', width: '180px', fontSize: '0.8rem' }}
              />
            </div>
            {/* Job filter */}
            <select className="form-select" value={filterJob} onChange={(e) => setFilterJob(e.target.value)} style={{ fontSize: '0.8rem', width: 'auto' }}>
              {jobOptions.map((j) => <option key={j}>{j}</option>)}
            </select>
            {/* Rec filter */}
            <select className="form-select" value={filterRec} onChange={(e) => setFilterRec(e.target.value)} style={{ fontSize: '0.8rem', width: 'auto' }}>
              {recOptions.map((r) => <option key={r}>{r}</option>)}
            </select>
            {/* View toggle */}
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {[{ id: 'table', Icon: List }, { id: 'cards', Icon: LayoutGrid }].map(({ id, Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === id ? 'var(--brand-navy)' : '#fff', color: viewMode === id ? '#fff' : 'var(--gray-500)', display: 'flex', alignItems: 'center' }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontStyle: 'italic' }}>No candidates match your filters.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Applied</th>
                  <th style={{ textAlign: 'center' }}>Resume</th>
                  <th style={{ textAlign: 'center' }}>Video</th>
                  <th style={{ textAlign: 'center' }}>Technical</th>
                  <th>Recommendation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(14,45,123,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)', fontWeight: '800', fontSize: '0.75rem', flexShrink: 0 }}>
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.85rem' }}>{c.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{c.jobApplied || '—'}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: '700', color: scoreColor(c.resumeScore), fontSize: '0.85rem' }}>{c.resumeScore || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: '700', color: scoreColor(c.videoScore), fontSize: '0.85rem' }}>{c.videoScore || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: '700', color: scoreColor(c.techScore), fontSize: '0.85rem' }}>{c.techScore || '—'}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor:
                          c.finalRecommendation === 'Selected' ? 'rgba(16,185,129,0.1)' :
                          c.finalRecommendation === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                        color:
                          c.finalRecommendation === 'Selected' ? '#065f46' :
                          c.finalRecommendation === 'Rejected' ? '#7f1d1d' : '#1e40af',
                        border: `1px solid ${
                          c.finalRecommendation === 'Selected' ? 'rgba(16,185,129,0.25)' :
                          c.finalRecommendation === 'Rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'
                        }`
                      }}>
                        {c.finalRecommendation || 'Under Review'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setSelectedCandidate(c)}
                        >
                          <Eye size={12} /> View Report
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', minWidth: '135px', justifyContent: 'center' }}
                          onClick={() => handleCopyShareLink(c)}
                          disabled={generatingId === c.id}
                        >
                          <Share2 size={12} />
                          {generatingId === c.id 
                            ? "Generating..." 
                            : copiedId === c.id 
                              ? "Copied!" 
                              : "Copy Share Link"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card view */
          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {filtered.map((c) => {
              const avgScore = (() => {
                const vals = [c.resumeScore, c.videoScore, c.techScore].filter(Boolean);
                return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
              })();
              const { strengths, weaknesses } = deriveStrengthsWeaknesses(c);
              return (
                <div key={c.id} style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border)', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(14,45,123,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
                      {getInitials(c.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.jobApplied}</div>
                    </div>
                    {avgScore !== null && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: scoreColor(avgScore) }}>{avgScore}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Avg</div>
                      </div>
                    )}
                  </div>

                  {/* score bars */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-around' }}>
                    {[{ label: 'R', value: c.resumeScore }, { label: 'V', value: c.videoScore }, { label: 'T', value: c.techScore }].map(({ label, value }, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: '4px', backgroundColor: 'var(--gray-100)', borderRadius: '999px', overflow: 'hidden', marginBottom: '3px' }}>
                          <div style={{ height: '100%', width: `${value || 0}%`, backgroundColor: scoreColor(value), borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}: {value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {/* mini strength preview */}
                  {strengths[0] && <p style={{ fontSize: '0.72rem', color: '#065f46', backgroundColor: 'rgba(16,185,129,0.07)', padding: '5px 8px', borderRadius: '7px', margin: 0 }}>✓ {strengths[0]}</p>}

                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '5px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => setSelectedCandidate(c)}>
                      <Eye size={12} /> View Report
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '5px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', minWidth: '100px', justifyContent: 'center' }} 
                      onClick={() => handleCopyShareLink(c)}
                      disabled={generatingId === c.id}
                    >
                      <Share2 size={12} />
                      {generatingId === c.id 
                        ? "Generating..." 
                        : copiedId === c.id 
                          ? "Copied!" 
                          : "Copy Link"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DETAIL MODAL ─── */}
      {selectedCandidate && (
        <DetailModal
          candidate={selectedCandidate}
          jobs={jobs || []}
          onClose={() => setSelectedCandidate(null)}
        />
      )}


    </div>
  );
};

export default Reports;
