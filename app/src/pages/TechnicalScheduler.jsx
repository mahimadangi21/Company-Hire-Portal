import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Link as LinkIcon, Edit2, X, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const TechnicalScheduler = () => {
  const { candidates, refreshCandidates } = useAppContext();

  useEffect(() => {
    refreshCandidates();
  }, []);
  const eligibleCandidates = candidates.filter(c => c.videoStatus === 'Completed' && c.techStatus !== 'Scheduled');
  const scheduledCandidates = candidates.filter(c => c.techStatus === 'Scheduled');
  
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCandidateChange = (e) => {
    const id = e.target.value;
    setSelectedCandidateId(id);
    setSelectedCandidate(eligibleCandidates.find(c => c.id.toString() === id) || null);
  };

  const handleSchedule = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/api/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCandidate.id,
          tech_status: 'Scheduled',
          stage: 'Technical Interview'
        })
      });

      if (res.ok) {
        alert("Interview scheduled successfully!");
        setSelectedCandidateId('');
        setSelectedCandidate(null);
        refreshCandidates();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to schedule interview");
      }
    } catch (e) {
      alert("Error scheduling interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        
        {/* Schedule Interview Panel (1 column) */}
        <div className="card" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.125rem' }}>Schedule Interview</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Candidate Name</label>
              <select className="form-select" value={selectedCandidateId} onChange={handleCandidateChange}>
                <option value="">-- Select Candidate --</option>
                {eligibleCandidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedCandidate ? (
              <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Job Role</label>
                    <input type="text" className="form-input" disabled value={selectedCandidate.jobApplied} style={{ backgroundColor: 'var(--gray-50)' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="text" className="form-input" disabled value={selectedCandidate.email} style={{ backgroundColor: 'var(--gray-50)' }} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Panelist(s)</label>
                  <select className="form-select" multiple style={{ height: '80px' }}>
                    <option value="john">John Doe (Engineering)</option>
                    <option value="sarah">Sarah Smith (Product)</option>
                    <option value="mike">Mike Johnson (HR)</option>
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hold Ctrl/Cmd to select multiple</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <div style={{ position: 'relative' }}>
                      <CalendarIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }} />
                      <input type="date" className="form-input" style={{ paddingLeft: '2.5rem' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }} />
                      <input type="time" className="form-input" style={{ paddingLeft: '2.5rem' }} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select className="form-select">
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Meeting Link</label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }} />
                    <input type="url" className="form-input" placeholder="https://zoom.us/j/..." style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={handleSchedule}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
                Select a candidate to load their data and configure interview details.
              </div>
            )}
          </div>
        </div>

        {/* Interview Table (2 columns) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title">Scheduled Interviews</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}>
                <CalendarIcon size={16} /> Calendar View
              </button>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate / Job</th>
                  <th>Date & Time</th>
                  <th>Panelists</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...eligibleCandidates, ...scheduledCandidates].map(candidate => {
                  const isScheduled = candidate.techStatus === 'Scheduled';
                  return (
                  <tr key={candidate.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{candidate.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.jobApplied}</div>
                    </td>
                    <td>
                      {isScheduled ? (
                        <>
                          <div style={{ fontSize: '0.875rem' }}>May 28, 2026</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10:00 AM (45m)</div>
                        </>
                      ) : (
                        <span className="badge badge-warning">Pending Schedule</span>
                      )}
                    </td>
                    <td>
                      {isScheduled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={14} color="var(--gray-500)" />
                          <span style={{ fontSize: '0.875rem' }}>John D.</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {isScheduled ? (
                          <>
                            <button className="btn btn-ghost" title="Edit" style={{ padding: '0.25rem' }}><Edit2 size={16}/></button>
                            <button className="btn btn-ghost" title="Resend" style={{ padding: '0.25rem' }}><Send size={16}/></button>
                            <button 
                              className="btn btn-ghost" 
                              title="Cancel" 
                              style={{ padding: '0.25rem', color: 'var(--danger)' }}
                              onClick={async () => {
                                if (window.confirm(`Cancel scheduled interview for ${candidate.name}?`)) {
                                  try {
                                    const res = await fetch('http://localhost:3000/api/candidates', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        id: candidate.id,
                                        tech_status: 'Pending',
                                        stage: 'Video Interview'
                                      })
                                    });
                                    if (res.ok) {
                                      refreshCandidates();
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }
                              }}
                            >
                              <X size={16}/>
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setSelectedCandidateId(candidate.id.toString());
                              setSelectedCandidate(candidate);
                            }}
                          >
                            Schedule Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
                {[...eligibleCandidates, ...scheduledCandidates].length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No upcoming interviews or eligible candidates found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TechnicalScheduler;
