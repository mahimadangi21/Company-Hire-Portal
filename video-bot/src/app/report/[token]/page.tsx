import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { CheckCircle2, Clock, X, BookOpen, Code2, Target, Briefcase, TrendingUp, TrendingDown, Award, AlertCircle, Lock } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getServiceSupabase();

  // Look up candidate by token stored inside extracted_data JSONB
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

function scoreColor(v?: number) {
  if (!v) return "#64748b";
  if (v >= 85) return "#10b981";
  if (v >= 70) return "#3b82f6";
  if (v >= 55) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(v?: number) {
  if (!v) return "N/A";
  if (v >= 85) return "Excellent";
  if (v >= 70) return "Good";
  if (v >= 55) return "Average";
  return "Needs Improvement";
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface ScoreGaugeProps {
  value: number;
  label: string;
  color: string;
}

function ScoreGauge({ value, label, color }: ScoreGaugeProps) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg width={90} height={90}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="#f1f5f9" strokeWidth={7} />
        <circle
          cx={45} cy={45} r={r} fill="none"
          stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x={45} y={49} textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{value || "—"}</text>
      </svg>
      <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "0.68rem", fontWeight: "600", color, padding: "2px 8px", borderRadius: "999px", backgroundColor: `${color}15` }}>{scoreLabel(value)}</span>
    </div>
  );
}

function SkillTag({ skill, matched }: { skill: string; matched?: boolean }) {
  if (matched === undefined) {
    return (
      <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: "600", backgroundColor: "rgba(14,45,123,0.08)", color: "#0E2D7B", border: "1px solid rgba(14,45,123,0.15)", display: "inline-block" }}>
        {skill}
      </span>
    );
  }
  return (
    <span style={{
      padding: "4px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px",
      backgroundColor: matched ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)",
      color: matched ? "#065f46" : "#7f1d1d",
      border: `1px solid ${matched ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
    }}>
      {matched ? "✓" : "✗"} {skill}
    </span>
  );
}

export default async function CandidateReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getServiceSupabase();

  // Fetch all candidates and find the one whose extracted_data._reportShareToken matches
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


  const data = candidate.extracted_data || {};
  const skills: string[] = candidate.skills || [];
  const edu = data.educationDetails || [];
  const projs = data.projectAnalysis || [];
  const exp = data.totalExperienceAnalysis || {};

  const avgScore = (() => {
    const vals = [candidate.resume_score, candidate.video_score, candidate.tech_score].filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : null;
  })();

  const recommendation = candidate.final_recommendation || "Under Review";
  const recColor = recommendation === "Selected" ? "#10b981" : recommendation === "Rejected" ? "#ef4444" : "#f59e0b";

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F4F7F6", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Nav Bar */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E2E8F0", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Logo href="/" size="sm" />
          <span style={{ padding: "3px 10px", borderRadius: "999px", backgroundColor: "rgba(14,45,123,0.08)", color: "#0E2D7B", fontSize: "0.72rem", fontWeight: "700", border: "1px solid rgba(14,45,123,0.15)" }}>
            Candidate Report
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "0.75rem", fontWeight: "600" }}>
          <Lock size={12} />
          Read-only view
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── CANDIDATE HEADER ── */}
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, #0E2D7B 0%, #1e40af 100%)", color: "#fff", border: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "rgba(125,186,0,0.2)", border: "2px solid rgba(125,186,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7DBA00", fontWeight: "900", fontSize: "1.2rem", flexShrink: 0 }}>
              {getInitials(candidate.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "1.4rem", fontWeight: "800", margin: "0 0 4px", color: "#fff" }}>{candidate.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", margin: 0 }}>
                {candidate.job_applied}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
              {avgScore !== null && (
                <div style={{ textAlign: "center", backgroundColor: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#7DBA00" }}>{avgScore}</div>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", fontWeight: "700", textTransform: "uppercase" }}>Overall Score</div>
                </div>
              )}
              <span style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "800", backgroundColor: recColor, color: "#fff" }}>
                {recommendation}
              </span>
            </div>
          </div>
        </div>

        {/* ── SCORE GAUGES ── */}
        {(candidate.resume_score || candidate.video_score || candidate.tech_score) && (
          <div style={{ ...cardStyle }}>
            <p style={sectionTitle}><Award size={13} /> Score Breakdown</p>
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem" }}>
              {candidate.resume_score && (
                <ScoreGauge value={candidate.resume_score} label="Resume" color={scoreColor(candidate.resume_score)} />
              )}
              {candidate.video_score && (
                <ScoreGauge value={candidate.video_score} label="Video Interview" color={scoreColor(candidate.video_score)} />
              )}
              {candidate.tech_score && (
                <ScoreGauge value={candidate.tech_score} label="Technical" color={scoreColor(candidate.tech_score)} />
              )}
            </div>
          </div>
        )}

        {/* ── SKILLS ── */}
        {skills.length > 0 && (
          <div style={{ ...cardStyle }}>
            <p style={sectionTitle}><Code2 size={13} /> Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {skills.map((s, i) => <SkillTag key={i} skill={s} />)}
            </div>
          </div>
        )}

        {/* ── EDUCATION ── */}
        {edu.length > 0 && (
          <div style={{ ...cardStyle }}>
            <p style={sectionTitle}><BookOpen size={13} /> Education</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {edu.map((e: any, i: number) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: i === 0 ? "rgba(14,45,123,0.03)" : "#fafbff", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(14,45,123,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Award size={16} color="#0E2D7B" />
                  </div>
                  <div>
                    <p style={{ fontWeight: "700", color: "#0E2D7B", fontSize: "0.88rem", margin: "0 0 2px" }}>{e.degree || "N/A"}</p>
                    <p style={{ color: "#64748b", fontSize: "0.78rem", margin: 0 }}>
                      {e.college || e.institution || "Institution N/A"}
                      {e.passingYear ? ` · ${e.passingYear}` : ""}
                      {e.cgpaOrPercentage ? ` · ${e.cgpaOrPercentage}` : ""}
                    </p>
                  </div>
                  {i === 0 && (
                    <span style={{ marginLeft: "auto", fontSize: "0.62rem", fontWeight: "800", padding: "2px 8px", borderRadius: "999px", backgroundColor: "#0E2D7B", color: "#fff", flexShrink: 0 }}>Highest</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EXPERIENCE ── */}
        {(exp.totalExperience || exp.domainExperience) && (
          <div style={{ ...cardStyle }}>
            <p style={sectionTitle}><Briefcase size={13} /> Experience Summary</p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {exp.totalExperience && (
                <div style={{ flex: 1, minWidth: "120px", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: "#fafbff", textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0E2D7B" }}>{exp.totalExperience}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Experience</div>
                </div>
              )}
              {exp.domainExperience && (
                <div style={{ flex: 1, minWidth: "120px", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: "#fafbff", textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#3b82f6" }}>{exp.domainExperience} yrs</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Domain Exp.</div>
                </div>
              )}
              {exp.leadershipExperience && (
                <div style={{ flex: 1, minWidth: "120px", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: "#fafbff", textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#10b981" }}>{exp.leadershipExperience}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Leadership</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {projs.length > 0 && (
          <div style={{ ...cardStyle }}>
            <p style={sectionTitle}><Code2 size={13} /> Projects</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
              {projs.map((p: any, i: number) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: "#fafbff", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "700", color: "#0E2D7B", fontSize: "0.85rem" }}>{p.projectName || `Project ${i + 1}`}</span>
                    <span style={{ fontSize: "0.62rem", backgroundColor: "rgba(14,45,123,0.08)", color: "#0E2D7B", padding: "2px 7px", borderRadius: "999px", fontWeight: "700" }}>P{i + 1}</span>
                  </div>
                  {p.projectDescription && (
                    <p style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5, margin: 0 }}>{p.projectDescription}</p>
                  )}
                  {p.technologiesUsed && p.technologiesUsed.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                      {p.technologiesUsed.map((t: string, j: number) => (
                        <span key={j} style={{ fontSize: "0.64rem", padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(125,186,0,0.1)", color: "#3d6600", border: "1px solid rgba(125,186,0,0.2)", fontWeight: "600" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PIPELINE STATUS ── */}
        <div style={{ ...cardStyle }}>
          <p style={sectionTitle}><Target size={13} /> Application Progress</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0", overflowX: "auto", paddingBottom: "4px" }}>
            {[
              { label: "Resume", status: candidate.resume_status },
              { label: "Form", status: candidate.form_status },
              { label: "Video", status: candidate.video_status },
              { label: "Technical", status: candidate.tech_status },
              { label: "Report", status: candidate.report_status },
            ].map((step, i, arr) => {
              const done = step.status && !["Pending", "Not Shared", "N/A"].includes(step.status);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < arr.length - 1 ? "1" : "0 0 auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: done ? "#10b981" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${done ? "#10b981" : "#E2E8F0"}` }}>
                      {done
                        ? <CheckCircle2 size={14} color="#fff" />
                        : <Clock size={12} color="#94a3b8" />}
                    </div>
                    <span style={{ fontSize: "0.62rem", fontWeight: "700", color: done ? "#0E2D7B" : "#94a3b8", whiteSpace: "nowrap" }}>{step.label}</span>
                    <span style={{ fontSize: "0.58rem", color: done ? "#10b981" : "#cbd5e1", fontWeight: "600" }}>{step.status || "—"}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ flex: 1, height: "2px", backgroundColor: done ? "#10b981" : "#E2E8F0", minWidth: "20px", margin: "0 4px", marginBottom: "22px" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── READ-ONLY NOTICE ── */}
        <div style={{ padding: "14px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", backgroundColor: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
          <Lock size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
          <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: 0, lineHeight: 1.5 }}>
            This is a <strong>read-only</strong> report shared by KadelLabs. You do not have access to any other candidate or platform data.
          </p>
        </div>

      </div>
    </div>
  );
}
