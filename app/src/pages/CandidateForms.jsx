import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, Search, ExternalLink, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const CandidateForms = () => {
  const { candidates, refreshCandidates } = useAppContext();

  useEffect(() => {
    refreshCandidates();
  }, []);
  const [filterJob, setFilterJob] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailModal, setEmailModal] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const stats = [
    { label: 'Forms Sent', value: candidates.length, color: 'var(--info)' },
    { label: 'Pending Submission', value: candidates.filter(c => c.formStatus === 'Pending').length, color: 'var(--warning)' },
    { label: 'Submitted', value: candidates.filter(c => c.formStatus === 'Submitted').length, color: 'var(--success)' }
  ];

  // Job options list computed dynamically
  const jobOptions = ['All', ...new Set(candidates.map(c => c.jobApplied).filter(Boolean))];

  const filteredCandidates = candidates.filter(c => {
    const matchesJob = filterJob === 'All' || c.jobApplied === filterJob;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesJob && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${stat.color}` }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--text-main)' }}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        
        {/* Table Area (Takes 2 columns) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title">Candidate Forms</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input 
                  type="text" 
                  placeholder="Search candidate..." 
                  className="form-input" 
                  style={{ paddingLeft: '2.25rem', width: '180px', fontSize: '0.875rem', paddingY: '0.25rem' }} 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select className="form-select" style={{ width: '180px', fontSize: '0.875rem' }} value={filterJob} onChange={e => setFilterJob(e.target.value)}>
                {jobOptions.map(job => (
                  <option key={job} value={job}>{job === 'All' ? 'All Jobs' : job}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Form Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No candidates found.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map(candidate => (
                    <tr key={candidate.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--brand-navy)' }}>{candidate.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{candidate.email}</div>
                      </td>
                      <td style={{ color: 'var(--gray-700)' }}>{candidate.jobApplied}</td>
                      <td>
                        {candidate.formStatus === 'Submitted' ? (
                          <span className="badge badge-success"><CheckCircle size={12} style={{ marginRight: '4px' }}/> Submitted</span>
                        ) : (
                          <span className="badge badge-warning"><Clock size={12} style={{ marginRight: '4px' }}/> Pending</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {candidate.formStatus === 'Submitted' ? (
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                              onClick={async () => {
                                try {
                                  const res = await fetch('http://localhost:3000/api/candidates', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: candidate.id,
                                      form_status: 'Pending',
                                      stage: 'Candidate Form'
                                    })
                                  });
                                  if (res.ok) refreshCandidates();
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                            >
                              Mark Pending
                            </button>
                          ) : (
                            <>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
                                onClick={() => setEmailModal({ candidate, email: candidate.email })}
                              >
                                <Send size={14} style={{ marginRight: '4px' }}/> Send Form
                              </button>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                                onClick={() => setEmailModal({ candidate, email: candidate.email })}
                              >
                                <Mail size={14} style={{ marginRight: '4px' }}/> Resend
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Preview Panel (Takes 1 column) */}
        <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.125rem' }}>Live Form Preview</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
            }}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <img 
                  src="https://thoughtleadership.kadellabs.com/wp-content/uploads/2023/09/log-kl.png" 
                  alt="Logo" 
                  style={{ height: '24px', margin: '0 auto 1rem', objectFit: 'contain' }}
                />
                <h4 style={{ fontWeight: '700', color: 'var(--brand-navy)' }}>Candidate Information</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Please review and submit your details.</p>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name</label>
                <input type="text" className="form-input" disabled value="Pre-filled from resume" style={{ backgroundColor: 'var(--gray-50)', fontSize: '0.8rem', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
                <input type="text" className="form-input" disabled value="Pre-filled from resume" style={{ backgroundColor: 'var(--gray-50)', fontSize: '0.8rem', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Skills Set</label>
                <textarea className="form-textarea" disabled value="Pre-filled from resume" style={{ backgroundColor: 'var(--gray-50)', fontSize: '0.8rem', height: '60px', cursor: 'not-allowed' }} />
              </div>
              
              <button className="btn btn-primary" disabled style={{ width: '100%', marginTop: '0.5rem', opacity: 0.7 }}>Submit Application</button>
            </div>
            
            <div style={{ backgroundColor: 'rgba(14, 45, 123, 0.05)', borderLeft: '3px solid var(--brand-navy)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ExternalLink size={16} color="var(--brand-navy)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-800)', margin: 0, lineHeight: 1.4 }}>This is a preview of the external link sent to candidates. No universal link exists; each candidate receives a unique, time-limited token.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Email Verification Modal */}
      {emailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => !isSendingEmail && setEmailModal(null)}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '450px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            border: '1px solid var(--border)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--gray-100)',
              backgroundColor: '#f8fafb'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--brand-navy)' }}>
                Verify Email Address
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Please confirm or edit the email address for <strong style={{ color: 'var(--brand-navy)' }}>{emailModal.candidate.name}</strong> before sending the form link.
              </p>
            </div>

            <div style={{ padding: '2rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={emailModal.email}
                  onChange={(e) => setEmailModal({ ...emailModal, email: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid var(--gray-100)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              backgroundColor: '#f8fafb'
            }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setEmailModal(null)}
                disabled={isSendingEmail}
                style={{ padding: '0.5rem 1.5rem' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                disabled={isSendingEmail || !emailModal.email}
                style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={async () => {
                  setIsSendingEmail(true);
                  try {
                    const res = await fetch('http://localhost:3000/api/emails/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'form_invite',
                        to: emailModal.email,
                        candidateName: emailModal.candidate.name,
                        jobRole: emailModal.candidate.jobApplied,
                        candidateId: emailModal.candidate.id
                      })
                    });
                    
                    if (res.ok) {
                      // Optionally update candidate email in backend
                      if (emailModal.email !== emailModal.candidate.email) {
                         await fetch('http://localhost:3000/api/candidates', {
                           method: 'PATCH',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                             id: emailModal.candidate.id,
                             email: emailModal.email
                           })
                         });
                         refreshCandidates();
                      }

                      alert(`Form invitation link sent successfully to ${emailModal.candidate.name} (${emailModal.email})!`);
                      setEmailModal(null);
                    } else {
                      alert('Failed to send form invitation');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Error sending form invitation');
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
              >
                {isSendingEmail ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Mail'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CandidateForms;
