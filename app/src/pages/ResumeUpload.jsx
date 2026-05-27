import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Search, MoreVertical, Loader2, Trash2, Clock, Mail, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ResumeUpload = () => {
  const { jobs, candidates, refreshCandidates } = useAppContext();
  const [selectedJob, setSelectedJob] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  const fileInputRef = useRef(null);

  const parsedCandidates = candidates.filter(c => c.resumeStatus === 'Parsed');

  const filteredCandidates = parsedCandidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.jobApplied.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleContainerClick = () => {
    if (!selectedJob) {
      setStatus({ type: 'error', message: 'Please select a job listed first.' });
      return;
    }
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (file) => {
    if (!selectedJob) {
      setStatus({ type: 'error', message: 'Please select a job listed first.' });
      return;
    }

    // Verify PDF file type
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setStatus({ type: 'error', message: 'Only PDF files are supported.' });
      return;
    }

    // Verify file size limit (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setStatus({ type: 'error', message: 'File is too large. Maximum size allowed is 5MB.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'info', message: 'Connecting to AI parsing engine...' });
    setUploadStep('Uploading PDF to server...');

    // Progress updates simulator to visual feedback
    const steps = [
      'Uploading PDF to server...',
      'Extracting raw text from PDF...',
      'Analyzing content with AI...',
      'Validating data structure...',
      'Finalizing candidate profile...'
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setUploadStep(steps[stepIdx]);
      }
    }, 1500);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      const result = await response.json();

      if (response.ok && result.success) {
        const data = result.data;
        const payload = {
          name: data.personalInformation?.fullName || file.name.replace('.pdf', ''),
          email: data.personalInformation?.email || 'No email provided',
          phone: data.personalInformation?.phoneNumber || 'No phone provided',
          skills: data.skillExtraction?.extractedSkills || [],
          job_applied: selectedJob,
          resume_status: 'Parsed',
          form_status: 'N/A',
          video_status: 'Pending',
          tech_status: 'Pending',
          report_status: 'Not Shared',
          stage: 'Resume Upload',
          resume_score: Math.round(75 + (data.totalExperienceAnalysis?.domainExperience || 0) * 2 + Math.random() * 5),
          extracted_data: data
        };

        const dbRes = await fetch('http://localhost:3000/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (dbRes.ok) {
          refreshCandidates();
          setStatus({ 
            type: 'success', 
            message: `Successfully parsed! Extracted profile for ${payload.name}.` 
          });
        } else {
          const dbErr = await dbRes.json();
          setStatus({ 
            type: 'error', 
            message: dbErr.error || 'Parsing succeeded but failed to save candidate to database.' 
          });
        }
      } else {
        setStatus({ 
          type: 'error', 
          message: result.error || 'Parsing failed. Please check the PDF contents.' 
        });
      }
    } catch (err) {
      clearInterval(interval);
      setStatus({ 
        type: 'error', 
        message: 'Could not reach the parsing server. Please ensure the backend is running on http://localhost:3001.' 
      });
    } finally {
      setIsUploading(false);
      setUploadStep('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      


      {/* Upload Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Upload Resumes</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Select a job listed and upload applicant resumes for AI parsing.</p>
        </div>
        <div className="card-body">
          <div className="form-group" style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
            <label className="form-label">Select Department <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select 
              className="form-select" 
              value={selectedJob} 
              onChange={(e) => {
                setSelectedJob(e.target.value);
                setStatus({ type: '', message: '' });
              }}
            >
              <option value="">-- Choose Job --</option>
              {jobs.map(job => (
                <option key={job.id} value={job.title}>{job.title} ({job.department})</option>
              ))}
            </select>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf" 
            style={{ display: 'none' }} 
          />

          <div 
            style={{
              border: `2px dashed ${dragActive ? 'var(--brand-green)' : 'var(--gray-300)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              backgroundColor: dragActive ? 'rgba(125, 186, 0, 0.05)' : 'var(--gray-50)',
              transition: 'all 0.3s ease',
              cursor: isUploading ? 'not-allowed' : 'pointer'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleContainerClick}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: dragActive || isUploading ? 'var(--brand-green)' : 'var(--gray-400)', transition: 'color 0.3s' }}>
              {isUploading ? (
                <Loader2 size={56} className="animate-spin" />
              ) : (
                <UploadCloud size={56} />
              )}
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--brand-navy)' }}>
              {isUploading ? uploadStep : 'Drag & drop resumes here'}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Supports PDF up to 5MB each.
            </p>
            <button 
              className="btn btn-primary" 
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                handleContainerClick();
              }}
            >
              Browse Files
            </button>
          </div>

          {/* Status banner positioned below dropzone */}
          {status.type && (
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: status.type === 'success' ? 'var(--success-bg)' : status.type === 'error' ? 'var(--danger-bg)' : 'var(--info-bg)',
              color: status.type === 'success' ? '#4d7300' : status.type === 'error' ? '#991b1b' : 'var(--brand-navy)',
              border: `1px solid ${status.type === 'success' ? 'rgba(125, 186, 0, 0.3)' : status.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(14, 45, 123, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.875rem',
              marginTop: '1.5rem'
            }}>
              {status.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--brand-green)' }} />}
              {status.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--danger)' }} />}
              {status.type === 'info' && <Loader2 size={18} className="animate-spin" style={{ color: 'var(--brand-navy)' }} />}
              <div style={{ fontWeight: '500' }}>{status.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Parsed Candidates Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="card-title">Parsed Candidates</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Email</th>
                <th>Job Applied</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(14, 45, 123, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)', fontWeight: '700', fontSize: '0.875rem' }}>
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{candidate.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>{candidate.email}</td>
                    <td>{candidate.jobApplied}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          View
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="btn btn-ghost" 
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === candidate.id ? null : candidate.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeDropdown === candidate.id && (
                            <div style={{ 
                              position: 'absolute', 
                              right: 0, 
                              top: '100%', 
                              backgroundColor: 'var(--surface)', 
                              border: '1px solid var(--border)', 
                              borderRadius: 'var(--radius-md)', 
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
                              zIndex: 10,
                              minWidth: '150px',
                              padding: '0.375rem 0'
                            }}>
                              <button 
                                style={{ 
                                  width: '100%', 
                                  textAlign: 'left', 
                                  padding: '0.5rem 1rem', 
                                  fontSize: '0.875rem', 
                                  color: 'var(--danger)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                                className="hover:bg-red-50 hover:bg-opacity-10 transition-colors"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(null);
                                  if(window.confirm(`Are you sure you want to delete ${candidate.name}?`)) {
                                    try {
                                      const res = await fetch(`http://localhost:3000/api/candidates?id=${candidate.id}`, {
                                        method: 'DELETE'
                                      });
                                      if(res.ok) {
                                        refreshCandidates();
                                        setStatus({ type: 'success', message: `${candidate.name} has been deleted.` });
                                      } else {
                                        setStatus({ type: 'error', message: `Failed to delete ${candidate.name}.` });
                                      }
                                    } catch(err) { 
                                      console.error(err); 
                                      setStatus({ type: 'error', message: `An error occurred while deleting.` });
                                    }
                                  }
                                }}
                              >
                                <Trash2 size={14} /> Delete Profile
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedCandidate && (
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
          zIndex: 999,
          padding: '2rem',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setSelectedCandidate(null)}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            border: '1px solid var(--border)'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--gray-100)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafb'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--brand-navy)' }}>
                  Candidate Profile Details
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Extracted via AI for <strong style={{ color: 'var(--brand-green)' }}>{selectedCandidate.jobApplied}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: 'var(--gray-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-gray-100 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '2rem' }}>
                
                {/* Left Column: Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)' }}>
                    <div style={{ 
                      width: '64px', height: '64px', borderRadius: '50%', 
                      backgroundColor: 'rgba(14, 45, 123, 0.1)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', 
                      color: 'var(--brand-navy)', fontWeight: '700', 
                      fontSize: '1.5rem', margin: '0 auto 1rem auto' 
                    }}>
                      {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--brand-navy)' }}>
                      {selectedCandidate.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {selectedCandidate.email}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {selectedCandidate.phone}
                    </p>
                  </div>

                  {/* Experience Section */}
                  <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    <h5 style={{ fontWeight: '600', color: 'var(--brand-navy)', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Experience Analysis
                    </h5>
                    {selectedCandidate.extractedData?.totalExperienceAnalysis ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Total:</span>
                          <strong>{selectedCandidate.extractedData.totalExperienceAnalysis.totalExperience || 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Domain:</span>
                          <strong>{selectedCandidate.extractedData.totalExperienceAnalysis.domainExperience} years</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Leadership:</span>
                          <strong>{selectedCandidate.extractedData.totalExperienceAnalysis.leadershipExperience || '0.0 years'}</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Total:</span>
                          <strong>N/A</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Domain:</span>
                          <strong>N/A</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Leadership:</span>
                          <strong>N/A</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills Tag Cloud */}
                  <div>
                    <h5 style={{ fontWeight: '600', color: 'var(--brand-navy)', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Skills Profile
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                        selectedCandidate.skills.map((skill, i) => (
                          <span 
                            key={i} 
                            className="badge badge-info" 
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No skills listed.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Deep Data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Education History */}
                  <div>
                    <h5 style={{ fontWeight: '600', color: 'var(--brand-navy)', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.375rem' }}>
                      Education Detail
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedCandidate.extractedData?.educationDetails && selectedCandidate.extractedData.educationDetails.length > 0 ? (
                        selectedCandidate.extractedData.educationDetails.map((edu, i) => (
                          <div key={i} style={{ padding: '0.75rem 1rem', backgroundColor: '#fcfcfc', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                              {edu.degree || 'Degree details N/A'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                              <span>{edu.college || 'Institution N/A'}</span>
                              <span>{edu.passingYear && `Class of ${edu.passingYear}`} {edu.cgpaOrPercentage && `| ${edu.cgpaOrPercentage}`}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          No education records extracted.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Analysis */}
                  <div>
                    <h5 style={{ fontWeight: '600', color: 'var(--brand-navy)', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.375rem' }}>
                      Project Highlights
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedCandidate.extractedData?.projectAnalysis && selectedCandidate.extractedData.projectAnalysis.length > 0 ? (
                        selectedCandidate.extractedData.projectAnalysis.map((proj, i) => (
                          <div key={i} style={{ padding: '0.875rem 1rem', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-md)', backgroundColor: '#fcfcfc' }}>
                            <div style={{ fontWeight: '600', color: 'var(--brand-navy)', fontSize: '0.875rem' }}>
                              {proj.projectName || 'Unnamed Project'}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginTop: '0.375rem', lineHeight: '1.4' }}>
                              {proj.projectDescription}
                            </div>
                            {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.625rem' }}>
                                {proj.technologiesUsed.map((t, idx) => (
                                  <span key={idx} style={{ fontSize: '0.65rem', backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)', padding: '0.125rem 0.375rem', borderRadius: '4px', fontWeight: '500' }}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          No projects extracted.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid var(--gray-100)',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafb'
            }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setSelectedCandidate(null)}
                style={{ padding: '0.5rem 1.5rem' }}
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}



    </div>
  );
};

export default ResumeUpload;
