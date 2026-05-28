import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { CheckCircle, Clock, X, BookOpen, Code2, Target, Briefcase, TrendingUp, TrendingDown, Award, AlertCircle, Lock, MessageSquare, Eye, FileText } from "lucide-react";
import React from 'react';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getServiceSupabase();

  const { data: candidates } = await supabase
    .from("candidates")
    .select("name, job_applied, extracted_data");

  const candidate = candidates?.find(
    (c: any) => c.extracted_data?._reportShareToken === token
  );

  if (!candidate) return { title: "Interview Report — KadelLabs" };
  return {
    title: `${candidate.name} — ${candidate.job_applied} | KadelLabs Report`,
    description: `Interview evaluation report for ${candidate.name} applying for ${candidate.job_applied}`,
    robots: "noindex, nofollow",
  };
}

const scoreColor = (v: any) => {
  if (!v) return 'var(--gray-400)';
  if (v >= 85) return '#10b981';
  if (v >= 70) return '#3b82f6';
  if (v >= 55) return '#f59e0b';
  return '#ef4444';
};

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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

/* ──────────────── Horizontal bar chart ─────────────────────────── */
const BarChart = ({ data = [], color = '#3b82f6' }: any) => {
  const max = Math.max(...data.map((d: any) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((d: any, i: number) => (
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

/* ──────────────── Skill Match Visual ─────────────────────────── */
const SkillMatch = ({ jobSkills = [], candidateSkills = [] }: any) => {
  const norm = (s: string) => s.trim().toLowerCase();
  const cSet = new Set(candidateSkills.map(norm));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {jobSkills.length === 0
        ? <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No required skills defined for this role.</span>
        : jobSkills.map((skill: string, i: number) => {
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
const TranscriptAnalysis = ({ transcript = [] }: any) => {
  if (!transcript || transcript.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No transcript available yet.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {transcript.map((entry: any, i: number) => (
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
const deriveStrengthsWeaknesses = (candidate: any) => {
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

export default async function CandidateReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getServiceSupabase();

  const { data: allCandidates, error } = await supabase
    .from("candidates")
    .select("*");

  const candidate = allCandidates?.find(
    (c: any) => c.extracted_data?._reportShareToken === token
  );

  if (error || !candidate) {
    notFound();
  }

  // Check expiry stored inside extracted_data
  const expiresAt = candidate.extracted_data?._reportShareExpiresAt;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F4F7F6" }}>
        <div style={{ textAlign: "center", padding: "3rem", maxWidth: "400px" }}>
          <Lock size={48} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
          <h2 style={{ color: "#0E2D7B", fontWeight: "800", marginBottom: "0.5rem" }}>Report Link Expired</h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>This report link has expired. Please contact the hiring team for a new link.</p>
        </div>
      </div>
    );
  }

  // Fetch jobs to get required skills
  const { data: rawJobs } = await supabase
    .from("jobs")
    .select("*");

  const jobs = (rawJobs || []).map((j: any) => ({
    ...j,
    required_skills: j.required_skills || j.skills || []
  }));

  const mappedCandidate = {
    ...candidate,
    jobApplied: candidate.job_applied,
    resumeStatus: candidate.resume_status,
    formStatus: candidate.form_status,
    videoStatus: candidate.video_status,
    techStatus: candidate.tech_status,
    reportStatus: candidate.report_status,
    resumeScore: candidate.resume_score,
    videoScore: candidate.video_score,
    techScore: candidate.tech_score,
    finalRecommendation: candidate.final_recommendation,
    extractedData: candidate.extracted_data
  };

  const data = mappedCandidate.extractedData || {};
  const skills = mappedCandidate.skills || [];
  const edu = data.educationDetails || [];
  const projs = data.projectAnalysis || [];
  const transcript = mappedCandidate.transcript || data.transcript || [];
  const { strengths, weaknesses } = deriveStrengthsWeaknesses(mappedCandidate);

  const matchedJob = jobs.find((j: any) => j.title === mappedCandidate.jobApplied);
  const jobSkills = matchedJob?.required_skills || matchedJob?.skills || [];

  const avgScore = (() => {
    const vals = [mappedCandidate.resumeScore, mappedCandidate.videoScore, mappedCandidate.techScore].filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : null;
  })();

  const NEXT_JS_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* Stand-alone Page Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1e3a8a 100%)', flexShrink: 0 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(125,186,0,0.25)', border: '2px solid rgba(125,186,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7DBA00', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
            {getInitials(mappedCandidate.name)}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '1.25rem', margin: 0 }}>{mappedCandidate.name}</h2>
              
              {/* Overall Score Badge */}
              {avgScore !== null && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#7DBA00',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  border: '1px solid rgba(125,186,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{avgScore}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.55rem', fontWeight: '600', textTransform: 'uppercase' }}>Overall</span>
                </span>
              )}

              {/* Recommendation Badge */}
              <span style={{
                padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700',
                backgroundColor: mappedCandidate.finalRecommendation === 'Selected' ? '#10b981' : mappedCandidate.finalRecommendation === 'Rejected' ? '#ef4444' : '#f59e0b',
                color: '#fff'
              }}>
                {mappedCandidate.finalRecommendation || 'Under Review'}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
              {mappedCandidate.jobApplied} · Experience: {mappedCandidate.extractedData?.totalExperienceAnalysis?.totalExperience || 'N/A'}
            </p>
          </div>
          
          {/* Top Right Side Controls (Logo & Read-only notice) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.08)', 
              padding: '0px 14px', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.12)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '45px',
              overflow: 'hidden'
            }}>
              <img 
                src="/kadellabs-logo.png" 
                alt="Kadel Labs Logo" 
                style={{ 
                  height: '75px', 
                  objectFit: 'contain', 
                  filter: 'brightness(0) invert(1)'
                }} 
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px' }}>
              <Lock size={12} />
              Read-only
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Hover Zoom / Expansion */}
      <style dangerouslySetInnerHTML={{__html: `
        .resume-parsed-box {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, max-height 0.25s ease;
          transform: scale(0.97);
          transform-origin: top center;
          max-height: 380px;
          overflow: hidden;
          position: relative;
        }
        .resume-parsed-box:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-height: 1200px;
          overflow-y: auto;
          z-index: 100;
        }
        /* Custom Scrollbar for hovered box */
        .resume-parsed-box::-webkit-scrollbar {
          width: 4px;
        }
        .resume-parsed-box::-webkit-scrollbar-track {
          background: transparent;
        }
        .resume-parsed-box::-webkit-scrollbar-thumb {
          background: rgba(14, 45, 123, 0.2);
          border-radius: 4px;
        }
      `}} />

      {/* Main Grid Area */}
      <div style={{ flex: 1, display: 'flex', gap: '1.5rem', padding: '1.5rem 2rem', backgroundColor: '#f8fafc', maxWidth: '1440px', margin: '0 auto', width: '100%', overflow: 'hidden' }}>
        
        {/* COLUMN 1: Scores & Skill Match (width: 32%) */}
        <div style={{ width: '32%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          
          {/* Overview / Score Radial Circles */}
          <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment Scores</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
              <RadialProgress value={mappedCandidate.resumeScore || 0} color={scoreColor(mappedCandidate.resumeScore)} label="Resume" size={76} />
              <RadialProgress value={mappedCandidate.videoScore || 0} color={scoreColor(mappedCandidate.videoScore)} label="Video" size={76} />
              <RadialProgress value={mappedCandidate.techScore || 0} color={scoreColor(mappedCandidate.techScore)} label="Technical" size={76} />
            </div>
          </div>

          {/* Resume Parsed Box */}
          <div className="resume-parsed-box" style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '750', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <FileText size={16} /> Resume Parsed
            </p>

            {/* Education History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} /> Education History
              </p>
              {edu.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {edu.map((e: any, i: number) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: i === 0 ? 'linear-gradient(135deg,rgba(14,45,123,0.03) 0%,rgba(125,186,0,0.03) 100%)' : 'var(--gray-50)', position: 'relative' }}>
                      {i === 0 && <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '0.58rem', fontWeight: '800', padding: '1px 6px', borderRadius: '999px', backgroundColor: 'var(--brand-navy)', color: '#fff' }}>Highest</span>}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(14,45,123,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Award size={16} color="var(--brand-navy)" />
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.8rem', margin: 0 }}>{e.degree || 'N/A'}</p>
                          <p style={{ color: 'var(--gray-600)', fontSize: '0.74rem', margin: '2px 0' }}>{e.college || e.institution || 'Institution N/A'}</p>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '2px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {e.passingYear && <span>🎓 Class of {e.passingYear}</span>}
                            {e.cgpaOrPercentage && <span>📊 {e.cgpaOrPercentage}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.74rem', fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: '10px' }}>No education records.</div>
              )}
            </div>

            {/* Extracted Skills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Code2 size={14} /> Extracted Skills
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {skills.length > 0 ? skills.map((s: string, i: number) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '600', backgroundColor: 'rgba(14,45,123,0.06)', color: 'var(--brand-navy)', border: '1px solid rgba(14,45,123,0.12)' }}>{s}</span>
                )) : <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills extracted.</span>}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 2: Profile Details & Strengths (width: 38%) */}
        <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Strengths & Weaknesses */}
          <div style={{ backgroundColor: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#065f46', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} color="#10b981" /> Strengths
                </p>
                {strengths.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {strengths.slice(0, 4).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <CheckCircle size={12} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: '600', lineHeight: 1.3 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '8px' }}>No derived strengths.</div>
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7f1d1d', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingDown size={14} color="#ef4444" /> Area of Improvement
                </p>
                {weaknesses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {weaknesses.slice(0, 4).map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '6px 8px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <AlertCircle size={12} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.72rem', color: '#7f1d1d', fontWeight: '600', lineHeight: 1.3 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic', border: '1px dashed rgba(239,68,68,0.3)', borderRadius: '8px' }}>No weaknesses detected.</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 3: Interview Q&A Transcript (width: 30%) */}
        <div style={{ width: '30%', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <MessageSquare size={14} /> Video Interview Transcript
            </p>
            {mappedCandidate.videoStatus === 'Completed' && (
              <a
                href={`${NEXT_JS_URL}/video-bot-admin/dashboard/interviews/${mappedCandidate.interview_id || ''}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ fontSize: '0.65rem', padding: '3px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Eye size={10} /> Watch Video
              </a>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
            <TranscriptAnalysis transcript={transcript} />
          </div>

        </div>

      </div>

    </div>
  );
}
