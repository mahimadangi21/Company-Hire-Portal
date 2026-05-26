import React, { useState } from 'react';
import { Video, Settings2, PlayCircle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const VideoBot = () => {
  const { jobs, candidates } = useAppContext();
  const [selectedJob, setSelectedJob] = useState(jobs[0]?.title || '');

  const activeJob = jobs.find(j => j.title === selectedJob);
  const relevantCandidates = candidates.filter(c => c.jobApplied === selectedJob && c.formStatus === 'Submitted');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        
        {/* Job Config Panel (1 column) */}
        <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.125rem' }}>Interview Configuration</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Select Job to View Config</label>
              <select className="form-select" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                {jobs.map(job => (
                  <option key={job.id} value={job.title}>{job.title}</option>
                ))}
              </select>
            </div>

            {activeJob && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Questions Count</span>
                  <span className="badge badge-gray">{activeJob.questions} Questions</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Duration (Auto)</span>
                  <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{activeJob.questions * 3} mins</span>
                </div>
                
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.5rem' }}>Mandatory Monitoring</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <CheckCircle size={16} color="var(--success)" /> Camera Required (ON)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <CheckCircle size={16} color="var(--success)" /> Microphone Required (ON)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <CheckCircle size={16} color="var(--success)" /> Screen Sharing (ON)
                    </div>
                  </div>
                </div>
                
                <div style={{ backgroundColor: 'var(--warning-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--warning)' }}>
                  Note: No retry functionality is enabled. Candidates receive a single attempt.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Table (2 columns) */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title">Candidate Interview Status</h3>
            <button className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}>
              <Settings2 size={16} /> Manage Question Bank
            </button>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Status</th>
                  <th>Monitoring</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {relevantCandidates.map(candidate => (
                  <tr key={candidate.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{candidate.name}</div>
                    </td>
                    <td>
                      {candidate.videoStatus === 'Completed' ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {candidate.videoStatus === 'Completed' ? (
                          <>
                            <span title="Camera OK"><CheckCircle size={16} color="var(--success)"/></span>
                            <span title="Audio OK"><CheckCircle size={16} color="var(--success)"/></span>
                            <span title="Screen OK"><CheckCircle size={16} color="var(--success)"/></span>
                          </>
                        ) : (
                          <>
                            <span title="Camera Pending"><XCircle size={16} color="var(--gray-300)"/></span>
                            <span title="Audio Pending"><XCircle size={16} color="var(--gray-300)"/></span>
                            <span title="Screen Pending"><XCircle size={16} color="var(--gray-300)"/></span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      {candidate.videoStatus === 'Completed' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><PlayCircle size={14}/> Video</button>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><Eye size={14}/> Score</button>
                        </div>
                      ) : (
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><Video size={14}/> Send Link</button>
                      )}
                    </td>
                  </tr>
                ))}
                {relevantCandidates.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No candidates ready for video interview in this job.</td>
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

export default VideoBot;
