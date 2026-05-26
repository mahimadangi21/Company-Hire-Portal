import React, { useState } from 'react';
import { Download, Share2, Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Reports = () => {
  const { candidates } = useAppContext();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Focus only on candidates who have at least reached technical interview
  const evaluatedCandidates = candidates.filter(c => c.techScore || c.videoScore);

  const avgVideoScore = evaluatedCandidates.filter(c => c.videoScore).length > 0
    ? Math.round(evaluatedCandidates.reduce((acc, c) => acc + (c.videoScore || 0), 0) / evaluatedCandidates.filter(c => c.videoScore).length)
    : 0;

  const avgTechScore = evaluatedCandidates.filter(c => c.techScore).length > 0
    ? Math.round(evaluatedCandidates.reduce((acc, c) => acc + (c.techScore || 0), 0) / evaluatedCandidates.filter(c => c.techScore).length)
    : 0;

  const selectionRate = evaluatedCandidates.length > 0
    ? Math.round((evaluatedCandidates.filter(c => c.finalRecommendation === 'Selected').length / evaluatedCandidates.length) * 100)
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

  const getBadgeColor = (recommendation) => {
    if (recommendation === 'Selected') return 'var(--success)';
    if (recommendation === 'Rejected') return 'var(--danger)';
    return 'var(--warning)';
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
                <th>Scores (R / V / T)</th>
                <th>Recommendation</th>
                <th>Share Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evaluatedCandidates.map(candidate => (
                <tr key={candidate.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--brand-navy)' }}>{candidate.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{candidate.jobApplied}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)', fontWeight: '500' }}>
                      <span title="Resume Score" style={{ color: candidate.resumeScore > 80 ? 'var(--success)' : 'inherit' }}>{candidate.resumeScore || '-'}</span> / 
                      <span title="Video Score" style={{ color: candidate.videoScore > 80 ? 'var(--success)' : 'inherit' }}>{candidate.videoScore || '-'}</span> / 
                      <span title="Tech Score" style={{ color: candidate.techScore > 80 ? 'var(--success)' : 'inherit' }}>{candidate.techScore || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '10px', height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: getBadgeColor(candidate.finalRecommendation),
                      marginRight: '8px'
                    }}></span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{candidate.finalRecommendation}</span>
                  </td>
                  <td>
                    {candidate.reportStatus === 'Shared' ? (
                      <span className="badge badge-success">Shared</span>
                    ) : (
                      <span className="badge badge-gray">Not Shared</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" title="View Report" style={{ padding: '0.375rem', color: 'var(--gray-600)' }}><Eye size={16}/></button>
                      <button className="btn btn-outline" title="Download PDF" style={{ padding: '0.375rem', color: 'var(--gray-600)' }}><Download size={16}/></button>
                      <button className="btn btn-primary" title="Share" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleShareClick(candidate)}>
                        <Share2 size={14}/> Share
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mock Share Modal */}
      {shareModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card animate-slide-up" style={{ width: '420px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--brand-navy)' }}>Share Report: {selectedCandidate?.name}</h3>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Recipient Emails</label>
                <input type="text" className="form-input" placeholder="manager@company.com, hr@company.com" />
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
            
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setShareModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert('Report shared!'); setShareModalOpen(false); }}>Send Report</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
