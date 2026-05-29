"use client";

import React, { useState, useEffect } from 'react';
import { Video, Settings2, PlayCircle, Eye, CheckCircle, XCircle, Send, Trash2, Loader2, Mail } from 'lucide-react';
import { useAppContext } from '@/components/admin/context/AppContext';
import QuestionBankModal from '@/components/admin/QuestionBankModal';

const NEXT_JS_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

const VideoBot = () => {
  const { candidates, jobs, refreshCandidates, apiFetch } = useAppContext();
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  // Dashboard state
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite Form state
  const [inviteCandidateId, setInviteCandidateId] = useState('');
  const [inviteJobRole, setInviteJobRole] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('Technology and Delivery');
  const [inviteSubDepartment, setInviteSubDepartment] = useState('PHP');
  const [sending, setSending] = useState(false);
  const [inviteSubject, setInviteSubject] = useState('');
  const [inviteBody, setInviteBody] = useState('');
  const [senders, setSenders] = useState([]);
  const [selectedSender, setSelectedSender] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  
  // Dynamic Departments from jobs
  const dynamicDepartments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)));
  const availableDepartments = dynamicDepartments.length > 0 ? dynamicDepartments : ['Technology and Delivery', 'Engineering', 'HR', 'Marketing'];
  
  const getAvailableSubDepartments = (dept) => {
    const subDepts = jobs.filter(j => j.department === dept).map(j => j.title);
    if (subDepts.length > 0) return subDepts;
    
    const defaults = {
      'Technology and Delivery': ['PHP', 'QA', 'Frontend', 'Backend'],
      'Engineering': ['DevOps', 'Data Science', 'SRE'],
      'HR': ['Recruitment', 'Operations'],
      'Marketing': ['SEO', 'Content', 'Social Media']
    };
    return defaults[dept] || ['General'];
  };
  
  // Copied indicator state
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, [showQuestionModal]); // refresh when modal closes

  useEffect(() => {
    const fetchSenders = async () => {
      try {
        const res = await apiFetch('/api/emails/senders');
        if (res.ok) {
          const data = await res.json();
          if (data.emails && data.emails.length > 0) {
            setSenders(data.emails);
            setSelectedSender(data.emails[0]);
            setReplyTo(data.emails[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch senders:", err);
      }
    };
    fetchSenders();
  }, []);
  
  // Set default selected department/sub-department once jobs load
  useEffect(() => {
    if (jobs.length > 0) {
      if (!inviteDepartment || !dynamicDepartments.includes(inviteDepartment)) {
        const firstDept = availableDepartments[0];
        setInviteDepartment(firstDept);
        setInviteSubDepartment(getAvailableSubDepartments(firstDept)[0]);
      }
    }
  }, [jobs]);

  useEffect(() => {
    if (inviteCandidateId) {
      const candidate = candidates.find(c => c.id.toString() === inviteCandidateId);
      if (candidate) {
        const jobRole = candidate.jobApplied || 'Common';
        setInviteSubject(`Your Interview Invitation — ${jobRole} Position`);
        setInviteBody(`Hello ${candidate.name} 👋,\n\nYou've been invited to complete a video interview for the ${jobRole} position. Our AI-powered platform will guide you through the process.\n\nWhat to expect:\n• The AI will ask you questions using voice\n• You control when to start and stop recording each answer\n• Your webcam will be on during the interview\n• Ensure you are in a quiet, well-lit space`);
        setTargetEmail(candidate.email || '');
      }
    } else {
      setInviteSubject('');
      setInviteBody('');
      setTargetEmail('');
    }
  }, [inviteCandidateId, candidates]);

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
      const res = await apiFetch('/api/interviews/list');
      const data = await res.json();
      setInterviews(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSendInvite = async (candidate, targetEmail, jobRole, department, subDepartment, subject, body, senderEmail) => {
    if (!candidate || !department || !subDepartment) return;

    setSending(true);
    try {
      const res = await apiFetch('/api/invites/send', {
        method: 'POST',
        body: JSON.stringify({
          candidate_name: candidate.name,
          candidate_email: targetEmail,
          job_role: jobRole,
          department: department,
          sub_department: subDepartment,
          subject: subject,
          body: body,
          senderEmail: senderEmail,
          replyToEmail: arguments[8] // since handleSendInvite takes 8 arguments + replyTo = 9 arguments
        })
      });

      if (res.ok) {
        // Update the candidate's email in the backend if it was edited
        if (targetEmail !== candidate.email) {
          try {
            await apiFetch('/api/candidates', {
              method: 'PATCH',
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
        setInviteSubject('');
        setInviteBody('');
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send invite");
      }
    } catch (e) {
      alert("Error sending invite");
    }
    setSending(false);
  };

  const filteredCandidatesForDropdown = candidates.filter(c => {
    const job = jobs.find(j => j.title === c.jobApplied);
    if (!job) return false;
    
    // Strict Department check based on the selected Department
    if (job.department !== inviteDepartment) return false;
    
    // Strict Sub-Department check (Sub-Department is stored as Job Title)
    if (inviteSubDepartment && inviteSubDepartment !== 'General') {
       if (job.title !== inviteSubDepartment) {
          return false; 
       }
    }
    return true;
  });

  const handleDeleteInterview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview record?")) return;

    try {
      const res = await apiFetch(`/api/interviews/${id}`, {
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

      {/* Unified Dashboard Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="card-title">Common Interview Questions</h3>
          <button className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setShowQuestionModal(true)}>
            <Settings2 size={16} /> Manage Question Bank
          </button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Sub-Department</th>
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
                              href={`${NEXT_JS_URL}/video-bot-admin/dashboard/interviews/${interview.id}`}
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

      {/* Send Invite Panel (horizontal layout) */}
      <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '1.125rem' }}>Send Video Invite</h3>
        </div>
        <div className="card-body">
          
          <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select 
                className="form-select" 
                value={inviteDepartment}
                onChange={e => {
                  const newDept = e.target.value;
                  setInviteDepartment(newDept);
                  const subs = getAvailableSubDepartments(newDept);
                  setInviteSubDepartment(subs[0]);
                  setInviteCandidateId('');
                }}
              >
                {availableDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sub-Department</label>
              <select 
                className="form-select"
                value={inviteSubDepartment}
                onChange={e => {
                  setInviteSubDepartment(e.target.value);
                  setInviteCandidateId('');
                }}
              >
                {(getAvailableSubDepartments(inviteDepartment)).map(sd => (
                  <option key={sd} value={sd}>{sd}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem', display: 'block' }}>
                Candidate will be asked all questions configured for this sub-department.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Select Candidate</label>
              <select className="form-select" value={inviteCandidateId} onChange={e => setInviteCandidateId(e.target.value)}>
                <option value="">Choose candidate...</option>
                {filteredCandidatesForDropdown.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.jobApplied || 'No Sub-Department'})</option>
                ))}
              </select>
              {filteredCandidatesForDropdown.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                  No candidates found for this department.
                </span>
              )}
            </div>
          </div>

          {inviteCandidateId && (
            <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--brand-navy)' }}>Email Configuration</h4>
                
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Send From</label>
                    <select 
                      className="form-select" 
                      value={selectedSender}
                      onChange={e => setSelectedSender(e.target.value)}
                    >
                      {senders.map(email => (
                        <option key={`sender-${email}`} value={email}>{email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Receive Replies To</label>
                    <select 
                      className="form-select" 
                      value={replyTo}
                      onChange={e => setReplyTo(e.target.value)}
                    >
                      {senders.map(email => (
                        <option key={`reply-${email}`} value={email}>{email}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Candidate Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--brand-navy)' }}>Message Content</h4>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={inviteSubject}
                    onChange={(e) => setInviteSubject(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Body</label>
                  <textarea 
                    className="form-input" 
                    rows="4"
                    value={inviteBody}
                    onChange={(e) => setInviteBody(e.target.value)}
                    style={{ resize: 'vertical', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '150px', justifyContent: 'center' }}
              onClick={() => {
                const candidate = candidates.find(c => c.id.toString() === inviteCandidateId);
                if (candidate) {
                  const jobRole = candidate.jobApplied || 'Common';
                  handleSendInvite(
                    candidate, 
                    targetEmail, 
                    jobRole, 
                    inviteDepartment, 
                    inviteSubDepartment,
                    inviteSubject,
                    inviteBody,
                    selectedSender,
                    replyTo
                  );
                }
              }}
              disabled={sending || !inviteCandidateId || !inviteSubject || !inviteBody}
            >
              {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send Mail</>}
            </button>
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default VideoBot;

