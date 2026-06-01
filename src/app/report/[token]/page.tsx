import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/server";
import { Lock } from "lucide-react";
import React from 'react';
import { ReportDashboardGrid } from "@/components/ReportDashboardGrid";

export const dynamic = "force-dynamic";

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

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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

  // Load completed interview matching by candidate email or name
  let matchedInterview = null;
  const candidateEmail = (candidate.email || candidate.extracted_data?.personalInformation?.email || "").trim().toLowerCase();
  const cleanName = (n: string) => (n || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const candName = cleanName(candidate.name || "");
  
  const { data: interviews } = await supabase
    .from("interviews")
    .select("*")
    .eq("status", "completed");
    
  if (interviews && interviews.length > 0) {
    const match = interviews.find((i: any) => {
      const matchesEmail = candidateEmail && (i.candidate_email || "").trim().toLowerCase() === candidateEmail;
      const matchesName = candName && cleanName(i.candidate_name || "") === candName;
      return matchesEmail || matchesName;
    });
    if (match) {
      matchedInterview = match;
    }
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

  const NEXT_JS_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f8fafc', zIndex: 9999, overflowY: 'auto' }}>
      {/* Header: Candidate Info & Read-Only Badge */}
      <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(14,45,123,0.1)', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800' }}>
            {getInitials(mappedCandidate.name)}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {mappedCandidate.name}
              <span style={{ fontSize: '0.85rem', color: 'var(--brand-green)', backgroundColor: 'rgba(125, 186, 0, 0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                #{mappedCandidate.display_id || mappedCandidate.unique_id || String(mappedCandidate.id).substring(0,6)}
              </span>
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', margin: '4px 0 0 0', fontWeight: '500' }}>
              {mappedCandidate.jobApplied} • {mappedCandidate.email}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/kadellabs-logo.png" 
            alt="Company Logo" 
            style={{ height: '36px', objectFit: 'contain' }} 
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: '600', background: 'var(--gray-100)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Lock size={12} />
            Read-only
          </div>
        </div>
      </div>
      
      {/* The actual dashboard grid */}
      <div style={{ padding: '2rem' }}>
        <ReportDashboardGrid candidate={mappedCandidate} NEXT_JS_URL={NEXT_JS_URL} matchedInterviewFromDb={matchedInterview} />
      </div>
    </div>
  );
}
