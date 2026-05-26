import React, { useState, useEffect } from 'react';
import { Video, Settings2, PlayCircle, Eye, CheckCircle, XCircle, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import QuestionBankModal from '../components/QuestionBankModal';

const NEXT_JS_URL = 'http://localhost:3000';

const VideoBot = () => {
  const { candidates } = useAppContext();
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  // Dashboard state
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Form state
  const [inviteCandidateId, setInviteCandidateId] = useState('');
  const [inviteJobRole, setInviteJobRole] = useState('');
  const [inviteQuestionCount, setInviteQuestionCount] = useState(3);
  const [jobRoles, setJobRoles] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInterviews();
    fetchJobRoles();
  }, [showQuestionModal]); // refresh when modal closes

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

  const fetchJobRoles = async () => {
    try {
      const res = await fetch(`${NEXT_JS_URL}/api/questions`);
      const data = await res.json();
      if (data) {
        setJobRoles([...new Set(data.map(q => q.job_role))]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendInvite = async () => {
    const candidate = candidates.find(c => c.id.toString() === inviteCandidateId);
    if (!candidate || !inviteJobRole || inviteQuestionCount < 1) return;

    setSending(true);
    try {
      const res = await fetch(`${NEXT_JS_URL}/api/invites/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: candidate.name,
          candidate_email: candidate.email, // Assuming the context has email
          job_role: inviteJobRole,
          number_of_questions: inviteQuestionCount
        })
      });

      if (res.ok) {
        alert("Invite sent successfully!");
        fetchInterviews();
        setInviteCandidateId('');
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send invite");
      }
    } catch (e) {
      alert("Error sending invite");
    }
    setSending(false);
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
                  <option key={c.id} value={c.id}>{c.name} ({c.jobApplied})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Job Role (Questions)</label>
              <select className="form-select" value={inviteJobRole} onChange={e => setInviteJobRole(e.target.value)}>
                <option value="">Choose role...</option>
                {jobRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
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
              onClick={handleSendInvite}
              disabled={sending || !inviteCandidateId || !inviteJobRole}
            >
              {sending ? 'Sending...' : <><Send size={16} /> Send Interview Link</>}
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
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              // Use the share_token
                              const url = `${NEXT_JS_URL}/share/${interview.share_token}`;
                              navigator.clipboard.writeText(url);
                              alert("Share link copied!");
                            }}
                          >
                            Copy Link
                          </button>

                          {status === 'completed' && (
                            <a 
                              href={`${NEXT_JS_URL}/admin/dashboard/interviews/${interview.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none' }}
                            >
                              <Eye size={14}/> View Interview
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoBot;
