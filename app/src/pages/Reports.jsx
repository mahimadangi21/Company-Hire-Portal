import React, { useState, useEffect } from 'react';
import { Download, Share2, Eye, FileText, CheckCircle, Clock, Trash2, X, Mail, Phone, Briefcase, Star, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Reports = () => {
  const { candidates, refreshCandidates } = useAppContext();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    refreshCandidates();
  }, []);

  // Focus only on candidates who have at least reached technical interview or video bot
  const evaluatedCandidates = candidates.filter(c => 
    (c.techScore !== null && c.techScore !== undefined && c.techScore !== '') || 
    (c.videoScore !== null && c.videoScore !== undefined && c.videoScore !== '') ||
    (c.resumeScore !== null && c.resumeScore !== undefined && c.resumeScore !== '')
  );

  const avgVideoScore = evaluatedCandidates.filter(c => c.videoScore).length > 0
    ? Math.round(evaluatedCandidates.reduce((acc, c) => acc + (c.videoScore || 0), 0) / evaluatedCandidates.filter(c => c.videoScore).length)
    : 0;

  const avgTechScore = evaluatedCandidates.filter(c => c.techScore).length > 0
    ? Math.round(evaluatedCandidates.reduce((acc, c) => acc + (c.techScore || 0), 0) / evaluatedCandidates.filter(c => c.techScore).length)
    : 0;

  const selectionRate = evaluatedCandidates.length > 0
    ? Math.round((evaluatedCandidates.filter(c => c.finalRecommendation === 'Selected' || c.final_recommendation === 'Selected').length / evaluatedCandidates.length) * 100)
    : 0;

  const stats = [
    { label: 'Total Evaluated', value: evaluatedCandidates.length },
    { label: 'Avg Video Score', value: avgVideoScore ? `${avgVideoScore}%` : '-' },
    { label: 'Avg Tech Score', value: avgTechScore ? `${avgTechScore}%` : '-' },
    { label: 'Selection Rate', value: selectionRate ? `${selectionRate}%` : '-' }
  ];

  const handleShareClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShareModalOpen(true);
  };

  const handleViewClick = (candidate) => {
    setSelectedCandidate(candidate);
    setViewModalOpen(true);
  };

  const handleSendShare = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCandidate.id,
          report_status: 'Shared'
        })
      });
      if (res.ok) {
        refreshCandidates();
        setShareModalOpen(false);
        alert(`Evaluation report for ${selectedCandidate.name} has been shared successfully!`);
      } else {
        alert('Failed to share report.');
      }
    } catch (e) {
      console.error(e);
      alert('Error sharing report.');
    }
  };

  const handleDeleteReport = async (candidate) => {
    if (window.confirm(`Are you sure you want to permanently delete the evaluation report for ${candidate.name}? This will remove them from the ATS system.`)) {
      try {
        const res = await fetch(`http://localhost:3000/api/candidates?id=${candidate.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          refreshCandidates();
          alert(`Report for ${candidate.name} has been deleted successfully.`);
        } else {
          alert('Failed to delete report.');
        }
      } catch (e) {
        console.error(e);
        alert('Error deleting report.');
      }
    }
  };

  const getBadgeColor = (recommendation) => {
    if (recommendation === 'Selected') return 'var(--success)';
    if (recommendation === 'Rejected') return 'var(--danger)';
    return 'var(--warning)';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>{stat.label}</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--brand-navy)' }}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Candidate Evaluation Reports</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Scores (Resume / Video / Tech)</th>
                <th>Recommendation</th>
                <th>Report Status</th>
                <th style={{ minWidth: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evaluatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>📄</div>
                    <div style={{ fontWeight: '700', color: 'var(--brand-navy)', marginBottom: '0.25rem', fontSize: '0.95rem' }}>No evaluation reports available</div>
                    <div style={{ fontSize: '0.8rem' }}>Screen candidates via Resume Upload or Video Bot to generate reports here.</div>
                  </td>
                </tr>
              ) : (
                evaluatedCandidates.map(candidate => (
                  <tr key={candidate.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          backgroundColor: 'var(--gray-100)', color: 'var(--brand-navy)',
                          fontSize: '0.75rem', fontWeight: '700', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          border: '1.5px solid var(--border)'
                        }}>
                          {getInitials(candidate.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--brand-navy)', fontSize: '0.875rem' }}>{candidate.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{candidate.jobApplied}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)', fontWeight: '600' }}>
                        <span title="Resume Score" style={{ color: candidate.resumeScore > 80 ? 'var(--success)' : 'inherit' }}>{candidate.resumeScore || '-'}</span> / 
                        <span title="Video Score" style={{ color: candidate.videoScore > 80 ? 'var(--success)' : 'inherit' }}>{candidate.videoScore || '-'}</span> / 
                        <span title="Tech Score" style={{ color: candidate.techScore > 80 ? 'var(--success)' : 'inherit' }}>{candidate.techScore || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '8px', height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: getBadgeColor(candidate.finalRecommendation),
                        marginRight: '8px'
                      }}></span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: getBadgeColor(candidate.finalRecommendation) }}>
                        {candidate.finalRecommendation || 'Under Review'}
                      </span>
                    </td>
                    <td>
                      {candidate.reportStatus === 'Shared' ? (
                        <span className="badge badge-success">Shared</span>
                      ) : (
                        <span className="badge badge-gray">Not Shared</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-outline"
                          title="View full evaluation report"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--brand-navy)',
                            borderColor: 'var(--border)'
                          }}
                          onClick={() => handleViewClick(candidate)}
                        >
                          <Eye size={13}/> View
                        </button>
                        <button
                          className="btn btn-outline"
                          title="Share report with hiring team"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--success)',
                            borderColor: 'var(--border)'
                          }}
                          onClick={() => handleShareClick(candidate)}
                        >
                          <Share2 size={13}/> Share
                        </button>
                        <button
                          className="btn btn-outline"
                          title="Permanently delete this report"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--danger)',
                            borderColor: 'var(--border)'
                          }}
                          onClick={() => handleDeleteReport(candidate)}
                        >
                          <Trash2 size={13}/> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card animate-slide-up" style={{ width: '420px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--brand-navy)' }}>Share Report: {selectedCandidate?.name}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShareModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Recipient Emails</label>
                <input type="text" className="form-input" placeholder="manager@company.com, hr@company.com" defaultValue="hiring@kadellabs.com" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Link Expiry</label>
                <select className="form-select">
                  <option>7 Days</option>
                  <option>30 Days</option>
                  <option>No Expiry</option>
                </select>
              </div>
            </div>
            
            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setShareModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendShare}>Send Report</button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Details Modal */}
      {viewModalOpen && selectedCandidate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card animate-slide-up" style={{ width: '580px', padding: '0', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: 'var(--brand-navy)', color: '#fff',
                  fontSize: '0.95rem', fontWeight: '700', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  {getInitials(selectedCandidate.name)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--brand-navy)', lineHeight: 1.2 }}>{selectedCandidate.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedCandidate.jobApplied}</div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setViewModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              
              {/* Profile Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{selectedCandidate.email || 'No email provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{selectedCandidate.phone || 'No phone number'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Stage: <strong>{selectedCandidate.stage || 'Evaluation'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  <Info size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Recommendation: <strong style={{ color: getBadgeColor(selectedCandidate.finalRecommendation) }}>{selectedCandidate.finalRecommendation || 'Under Review'}</strong></span>
                </div>
              </div>

              {/* High Fidelity Score Circles */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Evaluation Scores</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  
                  {/* Resume Card */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem 0.5rem', textAlign: 'center', background: '#fff' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Resume Matching</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: selectedCandidate.resumeScore >= 80 ? 'var(--success)' : selectedCandidate.resumeScore >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                      {selectedCandidate.resumeScore ? `${selectedCandidate.resumeScore}%` : '—'}
                    </div>
                  </div>

                  {/* Video Score */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem 0.5rem', textAlign: 'center', background: '#fff' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AI Video Bot</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: selectedCandidate.videoScore >= 80 ? 'var(--success)' : selectedCandidate.videoScore >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                      {selectedCandidate.videoScore ? `${selectedCandidate.videoScore}%` : '—'}
                    </div>
                  </div>

                  {/* Tech Interview */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem 0.5rem', textAlign: 'center', background: '#fff' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Technical Panel</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: selectedCandidate.techScore >= 80 ? 'var(--success)' : selectedCandidate.techScore >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                      {selectedCandidate.techScore ? `${selectedCandidate.techScore}%` : '—'}
                    </div>
                  </div>

                </div>
              </div>

              {/* Skills Tags */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Identified Skillsets</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} style={{
                        padding: '0.2rem 0.625rem',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: 'rgba(14, 45, 123, 0.06)',
                        color: 'var(--brand-navy)',
                        borderRadius: '9999px',
                        border: '1px solid rgba(14, 45, 123, 0.1)'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ATS Parse Intelligence */}
              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Summary Evaluation Note</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0, padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--gray-50)' }}>
                  {selectedCandidate.extractedData?.summary || 
                   `Candidate ${selectedCandidate.name} has undergone complete ATS matching and round-robin scheduling for the ${selectedCandidate.jobApplied} position. Overall recommendation stands at "${selectedCandidate.finalRecommendation || 'Under Review'}" based on the resume assessment of ${selectedCandidate.resumeScore || 0}% match and Video Screening performance.`}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setViewModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { alert('Report PDF download initiated!'); }}>
                <Download size={14} style={{ marginRight: '4px' }} /> Download PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
