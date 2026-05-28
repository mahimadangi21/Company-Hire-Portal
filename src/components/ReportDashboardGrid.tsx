"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, BookOpen, Award, Code2, TrendingUp, TrendingDown, 
  CheckCircle, AlertCircle, MessageSquare, Eye, X, Brain
} from 'lucide-react';
import { ResumeViewButton } from '@/components/ResumeViewButton';
import { TranscriptIntelligenceEngine } from '@/components/reports/TranscriptIntelligenceEngine';
import { analyzeTranscript } from '@/utils/transcriptAnalyzer';

/* ─────────────────── SVG Radial Progress ─────────────────────── */
const RadialProgress = ({ value = 0, size = 80, stroke = 7, color = '#3b82f6', label }: any) => {
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

/* ────────────────── Transcript Analysis ───────────────────────── */
const TranscriptAnalysis = ({ transcript = [] }: any) => {
  if (!transcript || transcript.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No transcript available yet.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {transcript.map((entry: any, i: number) => (
        <div key={i} style={{ padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: '#fafbff' }}>
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

const scoreColor = (v: any) => {
  if (!v) return 'var(--gray-400)';
  if (v >= 85) return '#10b981';
  if (v >= 70) return '#3b82f6';
  if (v >= 55) return '#f59e0b';
  return '#ef4444';
};

interface ReportDashboardGridProps {
  candidate: any;
  NEXT_JS_URL: string;
}

export function ReportDashboardGrid({ candidate, NEXT_JS_URL }: ReportDashboardGridProps) {
  const [activeModal, setActiveModal] = useState<'scores' | 'resume' | 'strengths' | 'transcript' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const edu = candidate.extractedData?.educationDetails || [];
  const skills = candidate.skills || [];
  const transcript = candidate.transcript || candidate.extractedData?.transcript || [];
  
  // Derive strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const data = candidate.extractedData || {};

  if (candidate.resumeScore >= 80) strengths.push('Strong resume score (' + candidate.resumeScore + '/100)');
  else if (candidate.resumeScore && candidate.resumeScore < 60) weaknesses.push('Below-average resume score (' + candidate.resumeScore + '/100)');

  const exp = data.totalExperienceAnalysis;
  if (exp) {
    const yrs = parseFloat(exp.domainExperience) || 0;
    if (yrs >= 3) strengths.push(`${yrs}+ years domain experience`);
    else if (yrs < 1) weaknesses.push('Limited domain experience (<1 year)');
    if (exp.leadershipExperience && parseFloat(exp.leadershipExperience) > 0)
      strengths.push(`Leadership experience (${exp.leadershipExperience})`);
  }

  if (skills.length >= 8) strengths.push(`Broad skill set (${skills.length} skills)`);
  else if (skills.length < 4) weaknesses.push(`Narrow skill set (only ${skills.length} skills listed)`);

  const eduDetails = data.educationDetails || [];
  if (eduDetails.length > 0) {
    const topEdu = eduDetails[0];
    if (/master|mba|m\.tech|msc/i.test(topEdu.degree || '')) strengths.push('Post-graduate education (' + topEdu.degree + ')');
    else if (/bachelor|b\.tech|be|bsc/i.test(topEdu.degree || '')) strengths.push('Undergraduate degree (' + topEdu.degree + ')');
  }

  const projs = data.projectAnalysis || [];
  if (projs.length >= 3) strengths.push(`${projs.length} notable projects demonstrated`);
  else if (projs.length === 0) weaknesses.push('No project portfolio extracted');

  if (candidate.videoScore >= 80) strengths.push('Excellent video interview performance');
  else if (candidate.videoScore && candidate.videoScore < 60) weaknesses.push('Low video interview score');

  if (candidate.techScore >= 80) strengths.push('Outstanding technical assessment');
  else if (candidate.techScore && candidate.techScore < 60) weaknesses.push('Below-par technical score');

  const handleClose = () => setActiveModal(null);

  // Modal Renderings
  const renderModalContent = () => {
    if (!activeModal) return null;

    switch (activeModal) {
      case 'scores':
        return (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--brand-navy)' }}>ASSESSMENT SCORES BREAKDOWN</h3>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '2rem 0', gap: '20px' }}>
              <RadialProgress value={candidate.resumeScore || 0} color={scoreColor(candidate.resumeScore)} label="Resume Evaluation" size={120} stroke={9} />
              <RadialProgress value={candidate.videoScore || 0} color={scoreColor(candidate.videoScore)} label="Video Interview" size={120} stroke={9} />
              <RadialProgress value={candidate.techScore || 0} color={scoreColor(candidate.techScore)} label="Technical Assessment" size={120} stroke={9} />
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '14px', fontSize: '0.82rem', lineHeight: '1.5', color: 'var(--gray-700)' }}>
              <strong>Scores Overview:</strong> These radial progress meters capture standard assessment dimensions. Each score is normalized on a 100-point scale based on skills extraction, response clarity, and automated test suite evaluations.
            </div>
          </div>
        );
      case 'resume':
        return (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={18} /> PARSED RESUME DETAILS</h3>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>
            
            {/* Education History in Modal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={16} /> Education History
              </p>
              {edu.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {edu.map((e: any, i: number) => (
                    <div key={i} style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--gray-50)' }}>
                      <p style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.85rem', margin: 0 }}>{e.degree || 'N/A'}</p>
                      <p style={{ color: 'var(--gray-600)', fontSize: '0.78rem', margin: '4px 0' }}>{e.college || e.institution || 'Institution N/A'}</p>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {e.passingYear && <span>Class of {e.passingYear}</span>}
                        {e.cgpaOrPercentage && <span>📊 {e.cgpaOrPercentage}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No education records available.</p>
              )}
            </div>

            {/* Extracted Skills in Modal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Code2 size={16} /> Extracted Skills
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skills.length > 0 ? skills.map((s: string, i: number) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: '600', backgroundColor: 'rgba(14,45,123,0.06)', color: 'var(--brand-navy)', border: '1px solid rgba(14,45,123,0.12)' }}>{s}</span>
                )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No skills extracted.</span>}
              </div>
            </div>
          </div>
        );
      case 'strengths':
        return (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--brand-navy)' }}>STRENGTHS & IMPROVEMENTS IN-DEPTH</h3>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#065f46', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} color="#10b981" /> Strengths
                </p>
                {strengths.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {strengths.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 12px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: '600', lineHeight: 1.4 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No strengths detected.</p>
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7f1d1d', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingDown size={16} color="#ef4444" /> Areas of Improvement
                </p>
                {weaknesses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {weaknesses.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 12px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.78rem', color: '#7f1d1d', fontWeight: '600', lineHeight: 1.4 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No weaknesses detected.</p>
                )}
              </div>
            </div>
          </div>
        );
      case 'transcript':
        return (
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '1050px', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}><Brain size={18} /> TRANSCRIPT INTELLIGENCE</h3>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <TranscriptIntelligenceEngine transcript={transcript} />
            </div>
          </div>
        );
    }
  };

  const renderViewMoreButton = (modalType: 'scores' | 'resume' | 'strengths' | 'transcript') => (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', paddingTop: '10px' }}>
      <button
        style={{ 
          padding: '4px 14px', 
          fontSize: '0.72rem', 
          height: '26px', 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          backgroundColor: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--brand-navy)',
          fontWeight: '700',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s'
        }}
        onClick={() => setActiveModal(modalType)}
      >
        View More
      </button>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', gap: '1.5rem', width: '100%', height: '100%', overflow: 'hidden' }}>
      
      {/* COLUMN 1: Scores & Skill Match (width: 32%) */}
      <div style={{ width: '32%', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'hidden' }}>
        
        {/* Overview / Score Radial Circles */}
        <div className="zoom-box" style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment Scores</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
            <RadialProgress value={candidate.resumeScore || 0} color={scoreColor(candidate.resumeScore)} label="Resume" size={76} />
            <RadialProgress value={candidate.videoScore || 0} color={scoreColor(candidate.videoScore)} label="Video" size={76} />
            <RadialProgress value={candidate.techScore || 0} color={scoreColor(candidate.techScore)} label="Technical" size={76} />
          </div>
          {renderViewMoreButton('scores')}
        </div>

        {/* Resume Parsed Box */}
        <div className="zoom-box" style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', gap: '6px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '750', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Resume Parsed
            </p>
            <ResumeViewButton candidate={candidate} />
          </div>

          {/* Education History preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} /> Education History
            </p>
            {edu.length > 0 ? (
              <div style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'linear-gradient(135deg,rgba(14,45,123,0.03) 0%,rgba(125,186,0,0.03) 100%)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Award size={14} color="var(--brand-navy)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <p style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.76rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edu[0].degree || 'N/A'}</p>
                    <p style={{ color: 'var(--gray-600)', fontSize: '0.7rem', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edu[0].college || edu[0].institution || 'Institution N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: '10px' }}>No education records.</div>
            )}
          </div>

          {/* Extracted Skills preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
            <p style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code2 size={14} /> Extracted Skills
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', overflow: 'hidden', maxHeight: '56px' }}>
              {skills.length > 0 ? skills.slice(0, 4).map((s: string, i: number) => (
                <span key={i} style={{ padding: '2px 6px', borderRadius: '999px', fontSize: '0.64rem', fontWeight: '600', backgroundColor: 'rgba(14,45,123,0.06)', color: 'var(--brand-navy)', border: '1px solid rgba(14,45,123,0.12)' }}>{s}</span>
              )) : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills extracted.</span>}
              {skills.length > 4 && <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '4px', fontWeight: '700' }}>+{skills.length - 4} more</span>}
            </div>
          </div>
          {renderViewMoreButton('resume')}
        </div>

      </div>

      {/* COLUMN 2: Profile Details & Strengths (width: 38%) */}
      <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'hidden' }}>
        
        {/* Strengths & Weaknesses */}
        <div className="zoom-box" style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'fit-content', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observations</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '4px', overflow: 'hidden' }}>
            <div>
              <p style={{ fontSize: '0.74rem', fontWeight: '700', color: '#065f46', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={12} color="#10b981" /> Strengths
              </p>
              {strengths.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {strengths.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <CheckCircle size={10} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.66rem', color: '#065f46', fontWeight: '600', lineHeight: 1.3 }}>{s}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', fontStyle: 'italic', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '8px' }}>No derived strengths.</div>
              )}
            </div>
            <div>
              <p style={{ fontSize: '0.74rem', fontWeight: '700', color: '#7f1d1d', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingDown size={12} color="#ef4444" /> Improvements
              </p>
              {weaknesses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {weaknesses.slice(0, 3).map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', padding: '4px 6px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <AlertCircle size={10} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.66rem', color: '#7f1d1d', fontWeight: '600', lineHeight: 1.3 }}>{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', fontStyle: 'italic', border: '1px dashed rgba(239,68,68,0.3)', borderRadius: '8px' }}>No weaknesses detected.</div>
              )}
            </div>
          </div>
          {renderViewMoreButton('strengths')}
        </div>

      </div>

      {/* COLUMN 3: Transcript Intelligence (width: 30%) */}
      <div className="zoom-box" style={{ width: '30%', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', height: 'fit-content', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Brain size={14} /> Transcript Intelligence
          </p>
        </div>

        {transcript.length > 0 ? (
          <TranscriptCompactView transcript={transcript} onViewMore={() => setActiveModal('transcript')} />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1rem' }}>
            <Brain size={28} color="var(--brand-navy)" opacity={0.25} />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontStyle: 'italic' }}>No transcript uploaded yet</p>
          </div>
        )}
      </div>

      {/* PORTAL FOR DETAILS VIEW MODAL OVERLAYS */}
      {mounted && activeModal && typeof document !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem'
          }} 
          onClick={handleClose}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {renderModalContent()}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

/* ─────────────── Compact Transcript View for Column 3 ───────── */
function TranscriptCompactView({ transcript, onViewMore }: { transcript: any[]; onViewMore: () => void }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const analysis = useMemo(() => analyzeTranscript(transcript), [transcript]);

  // Full SVG Radar labels to make them fully visible and clear
  const radarData = [
    { label: 'Communication', value: analysis.communication, color: '#3b82f6' },
    { label: 'Technical', value: analysis.technical, color: '#8b5cf6' },
    { label: 'Problem Solving', value: analysis.problemSolving, color: '#f59e0b' },
    { label: 'Leadership', value: analysis.leadership, color: '#10b981' },
    { label: 'Confidence', value: analysis.confidence, color: '#ef4444' },
    { label: 'Professionalism', value: analysis.professionalism * 10, color: '#0ea5e9' },
  ];
  const size = 270; // Enlarged as requested
  const cx = size / 2;
  const cy = size / 2;
  const radius = 74; // Leaves plenty of space for full text labels around edges
  const n = radarData.length;

  const getPoint = (index: number, r: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [0.33, 0.66, 1];
  const polygonPoints = radarData.map((d, i) => {
    const r = (Math.max(0, Math.min(100, d.value)) / 100) * radius;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(' ');

  const toneColor = analysis.tone === 'Positive' ? '#10b981' : analysis.tone === 'Cautious' ? '#f59e0b' : '#3b82f6';
  const sentColor = analysis.sentiment === 'Positive' ? '#10b981' : analysis.sentiment === 'Mixed' ? '#f59e0b' : '#6b7280';
  const fillerColor = analysis.fillerWordCount > 8 ? '#ef4444' : analysis.fillerWordCount > 3 ? '#f59e0b' : '#10b981';
  const recColor = analysis.recommendation === 'Strongly Recommend' || analysis.recommendation === 'Recommend'
    ? '#10b981' : analysis.recommendation === 'Consider' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', width: '100%', alignItems: 'center' }}>
      
      {/* 4 Colorful Badge Pills in one horizontal line above the radar chart */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '6px', flexShrink: 0 }}>
        {[
          { label: 'Tone',        value: analysis.tone,           color: toneColor },
          { label: 'Sentiment',   value: analysis.sentiment,      color: sentColor },
          { label: 'Fillers',     value: `${analysis.fillerWordCount}`,  color: fillerColor },
          { label: 'Recommend',   value: analysis.recommendation.split(' ')[0], color: recColor },
        ].map((b, i) => (
          <div key={i} style={{
            flex: 1,
            padding: '6px 4px',
            borderRadius: '16px',
            backgroundColor: `${b.color}12`,
            border: `1.5px solid ${b.color}25`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
            minWidth: 0,
            cursor: 'default'
          }}>
            <span style={{ fontSize: '0.5rem', fontWeight: '750', color: b.color, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
              {b.label}
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: b.color, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
              {b.value}
            </span>
          </div>
        ))}
      </div>

      {/* Radar chart directly below badges */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', margin: '4px 0 0' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {gridLevels.map((level, li) => {
            const pts = radarData.map((_, i) => {
              const p = getPoint(i, radius * level);
              return `${p.x},${p.y}`;
            }).join(' ');
            return <polygon key={li} points={pts} fill="none" stroke="rgba(14,45,123,0.15)" strokeWidth={1.2} />;
          })}
          {radarData.map((_, i) => {
            const outer = getPoint(i, radius);
            return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(14,45,123,0.15)" strokeWidth={1.2} />;
          })}

          {/* Area polygon */}
          <polygon points={polygonPoints} fill="rgba(14,45,123,0.12)" stroke="var(--brand-navy)" strokeWidth={2.2} strokeLinejoin="round" />
          
          {/* Central IQ Badge (Always stays clean and static) */}
          <circle cx={cx} cy={cy} r={12} fill="#f8fafc" stroke="rgba(14,45,123,0.08)" strokeWidth={1} />
          <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="var(--brand-navy)" opacity={0.3} fontFamily="'Inter',sans-serif">IQ</text>

          {/* Dots */}
          {radarData.map((d, i) => {
            const r = (Math.max(0, Math.min(100, d.value)) / 100) * radius;
            const p = getPoint(i, r);
            const isHovered = hoveredIndex === i;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5.5 : 3.5}
                fill={d.color}
                stroke="#fff"
                strokeWidth={isHovered ? 2 : 1.5}
                style={{ transition: 'all 0.15s ease' }}
              />
            );
          })}

          {/* Invisible interactive hover targets over the dots */}
          {radarData.map((d, i) => {
            const r = (Math.max(0, Math.min(100, d.value)) / 100) * radius;
            const p = getPoint(i, r);
            return (
              <circle
                key={`hover-${i}`}
                cx={p.x}
                cy={p.y}
                r={18}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {/* Outer text labels - programmatically placed around chart */}
          {radarData.map((d, i) => {
            const p = getPoint(i, radius + 15);
            const anchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle';
            let dy = 3;
            if (i === 0) dy = -5;
            if (i === 3) dy = 11;
            const isHovered = hoveredIndex === i;
            return (
              <text
                key={`label-${i}`}
                x={p.x}
                y={p.y + dy}
                textAnchor={anchor}
                fontSize="8.5"
                fontWeight={isHovered ? "800" : "750"}
                fill={isHovered ? d.color : "var(--brand-navy)"}
                fontFamily="'Inter',sans-serif"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {d.label}
              </text>
            );
          })}

          {/* Elegant Floating Tooltip Pill showing percentage next to hovered dot */}
          {hoveredIndex !== null && (
            (() => {
              const d = radarData[hoveredIndex];
              const r = (Math.max(0, Math.min(100, d.value)) / 100) * radius;
              const p = getPoint(hoveredIndex, r);
              const tx = p.x;
              const ty = p.y - 14;
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={tx - 22}
                    y={ty - 14}
                    width={44}
                    height={18}
                    rx={6}
                    fill="var(--brand-navy)"
                    stroke="#fff"
                    strokeWidth={1}
                    filter="drop-shadow(0px 2px 4px rgba(15,23,42,0.2))"
                  />
                  <text
                    x={tx}
                    y={ty - 1.5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#fff"
                    fontFamily="'Inter',sans-serif"
                  >
                    {d.value}%
                  </text>
                  <polygon
                    points={`${tx - 4},${ty + 4} ${tx + 4},${ty + 4} ${tx},${ty + 8}`}
                    fill="var(--brand-navy)"
                  />
                </g>
              );
            })()
          )}
        </svg>
      </div>

      {/* View More Button moved upside */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '6px' }}>
        <button
          style={{ 
            padding: '4px 14px', 
            fontSize: '0.72rem', 
            height: '26px', 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            backgroundColor: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--brand-navy)',
            fontWeight: '700',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s'
          }}
          onClick={onViewMore}
        >
          View More
        </button>
      </div>
    </div>
  );
}
