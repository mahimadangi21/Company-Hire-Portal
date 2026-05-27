import React, { useState, useEffect } from 'react';
import { Video, Settings2, PlayCircle, Eye, CheckCircle, XCircle, Send, Trash2, Loader2, Mail } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import QuestionBankModal from '../components/QuestionBankModal';

const NEXT_JS_URL = 'http://localhost:3000';

const VideoBot = () => {
  const { candidates, jobs, refreshCandidates } = useAppContext();
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  // Dashboard state
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Form state
  const [inviteCandidateId, setInviteCandidateId] = useState('');
  const [inviteJobRole, setInviteJobRole] = useState('');
  const [inviteQuestionCount, setInviteQuestionCount] = useState(3);
  const [sending, setSending] = useState(false);
  const [emailModal, setEmailModal] = useState(null);
  
  // Copied indicator state
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, [showQuestionModal]); // refresh when modal closes

  const copyToClipboard = (text, id) => {
    // Execute synchronous copy first to guarantee it runs inside the user gesture
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
      // Fallback to async clipboard API if execCommand is not supported
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(err => console.error("Clipboard API failed", err));
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await fetch(`${NEXT_JS_URL}/api/interviews/list`);
      const data = await res.json();
      setInterviews(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSendInvite = async (candidate, targetEmail, jobRole, questionCount) => {
    if (!candidate || !jobRole || questionCount < 1) return;

    setSending(true);
    try {
      const res = await fetch(`${NEXT_JS_URL}/api/invites/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: candidate.name,
          candidate_email: targetEmail,
          job_role: jobRole,
          number_of_questions: questionCount
        })
      });

      if (res.ok) {
        // Update the candidate's email in the backend if it was edited
        if (targetEmail !== candidate.email) {
          try {
            await fetch(`${NEXT_JS_URL}/api/candidates`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: candidate.id,
                email: targetEmail
              })
            });
            refreshCandidates();
          } catch (patchErr) {
            console.error("Failed to update candidate email:", patchErr);
          }
        }
        
        alert("Invite sent successfully!");
        fetchInterviews();
        setInviteCandidateId('');
        setEmailModal(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send invite");
      }
    } catch (e) {
      alert("Error sending invite");
    }
    setSending(false);
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview record?")) return;

    try {
      const res = await fetch(`${NEXT_JS_URL}/api/interviews/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert("Interview deleted successfully!");
        fetchInterviews();
      } else {
        alert("Failed to delete interview");
      }
    } catch (e) {
      alert("Error deleting interview");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {showQuestionModal && (
        <QuestionBankModal onClose={() => setShowQuestionModal(false)} />
      )}

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        
        {/* Send Invite Panel (1 column) */}
        <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.125rem' }}>Send Video Invite</h3>
          </div>
          <div className="card-body">
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Candidate</label>
              <select className="form-select" value={inviteCandidateId} onChange={e => setInviteCandidateId(e.target.value)}>
                <option value="">Choose candidate...</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.jobApplied || 'No Job'})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Job Role (Questions)</label>
              <select className="form-select" value={inviteJobRole} onChange={e => setInviteJobRole(e.target.value)}>
                <option value="">Choose role...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.title}>{job.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Number of Questions to Ask</label>
              <input 
                type="number" 
                className="form-input" 
                min="1" 
                max="20"
                value={inviteQuestionCount}
                onChange={e => setInviteQuestionCount(parseInt(e.target.value))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem', display: 'block' }}>
                Will prioritize mandatory questions first, then random.
              </span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => {
                const candidate = candidates.find(c => c.id.toString() === inviteCandidateId);
                if (candidate) {
                  setEmailModal({
                    candidate,
                    email: candidate.email,
                    jobRole: inviteJobRole,
                    questionCount: inviteQuestionCount
                  });
                }
              }}
              disabled={sending || !inviteCandidateId || !inviteJobRole}
            >
              <Send size={16} /> Send Interview Link
            </button>
            
          </div>
        </div>

        {/* Unified Dashboard Table (2 columns) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title">Interview Status Dashboard</h3>
            <button className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setShowQuestionModal(true)}>
              <Settings2 size={16} /> Manage Question Bank
            </button>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading interviews...</td>
                  </tr>
                ) : interviews.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>No interviews found. Send one!</td>
                  </tr>
                ) : interviews.map(interview => {
                  // Determine status (expired, completed, pending)
                  const isExpired = new Date(interview.expires_at) < new Date();
                  const status = interview.status === "completed" ? "completed" : (isExpired ? "expired" : "pending");

                  return (
                    <tr key={interview.id}>
                      <td>
                        <div style={{ fontWeight: '500' }}>{interview.candidate_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{interview.candidate_email}</div>
                      </td>
                      <td>
                        <span className="badge badge-gray">{interview.job_role}</span>
                      </td>
                      <td>
                        {status === 'completed' ? (
                          <span className="badge badge-success">Completed</span>
                        ) : status === 'expired' ? (
                           <span className="badge badge-error" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Expired</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {status === 'completed' ? (
                            <>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '110px' }}
                                onClick={() => {
                                  const url = `${NEXT_JS_URL}/share/${interview.share_token}`;
                                  copyToClipboard(url, `share-${interview.id}`);
                                }}
                              >
                                {copiedId === `share-${interview.id}` ? "Copied!" : "Copy Share Link"}
                              </button>
                              <a 
                                href={`${NEXT_JS_URL}/admin/dashboard/interviews/${interview.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none' }}
                              >
                                <Eye size={14}/> View Interview
                              </a>
                            </>
                          ) : (
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '110px' }}
                              onClick={() => {
                                const url = `${NEXT_JS_URL}/interview/${interview.id}`;
                                copyToClipboard(url, `invite-${interview.id}`);
                              }}
                            >
                              {copiedId === `invite-${interview.id}` ? "Copied!" : "Copy Invite Link"}
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost" 
                            title="Delete Interview" 
                            style={{ padding: '0.25rem', color: 'var(--danger)' }}
                            onClick={() => handleDeleteInterview(interview.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
        }} onClick={() => !sending && setEmailModal(null)}>
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
                Please confirm or edit the email address for <strong style={{ color: 'var(--brand-navy)' }}>{emailModal.candidate.name}</strong> before sending the video interview link.
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
                disabled={sending}
                style={{ padding: '0.5rem 1.5rem' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                disabled={sending || !emailModal.email}
                style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => handleSendInvite(emailModal.candidate, emailModal.email, emailModal.jobRole, emailModal.questionCount)}
              >
                {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Mail'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default VideoBot;
