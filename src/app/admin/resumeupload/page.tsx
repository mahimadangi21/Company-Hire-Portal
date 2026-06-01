"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Search, MoreVertical, Loader2, Trash2, Clock, Mail, Send, Share2, CheckSquare, XSquare } from 'lucide-react';
import { useAppContext } from '@/components/admin/context/AppContext';
import StandardResume from '@/components/admin/StandardResume';
import WorkflowBadge from '@/components/admin/WorkflowBadge';
import ConfirmActionModal from '@/components/admin/ConfirmActionModal';

const ResumeUpload = () => {
  const { jobs, candidates, refreshCandidates, apiFetch } = useAppContext();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSubDepartment, setSelectedSubDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'approve' | 'reject', candidate: any } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleWorkflowAction = async (candidate: any, type: 'approve' | 'reject', reason?: string) => {
    setActionLoading(candidate.id);
    setConfirmModal(null);
    try {
      const endpoint = type === 'approve'
        ? `/api/candidate/resume-approve/${candidate.id}`
        : `/api/candidate/resume-reject/${candidate.id}`;
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: type === 'reject' ? JSON.stringify({ reason }) : undefined,
      });
      if (res.ok) {
        refreshCandidates();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData?.error ?? `Failed to ${type} resume.`);
      }
    } catch (err) {
      console.error('[handleWorkflowAction]', err);
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const dynamicDepartments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)));
  
  const getAvailableSubDepartments = (dept: string) => {
    return Array.from(new Set(jobs.filter((j: any) => j.department === dept && j.sub_department).map((j: any) => j.sub_department)));
  };

  const getAvailableRoles = (dept: string, subDept: string) => {
    return Array.from(new Set(jobs.filter((j: any) => j.department === dept && (j.sub_department === subDept || !j.sub_department)).map((j: any) => j.title)));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.dropdown-trigger') || target.closest('.dropdown-menu')) {
        return;
      }
      setActiveDropdown(null);
    };
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
    if (!selectedRole) {
      setStatus({ type: 'error', message: 'Please select a role first.' });
      return;
    }
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (file: File) => {
    if (!selectedRole) {
      setStatus({ type: 'error', message: 'Please select a role first.' });
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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const rawText = await response.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Server returned non-JSON response: ${rawText.substring(0, 100)}...`);
      }
      if (response.ok && result.success) {
        const data = result.data;
        const reportToken = typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID().replace(/-/g, '') + window.crypto.randomUUID().replace(/-/g, '')
          : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

        const payload = {
          name: data.personalInformation?.fullName || (file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').replace(/\b(resume|cv|document|copy)\b/gi, '').replace(/\s+/g, ' ').trim() || 'Unknown Candidate'),
          email: data.personalInformation?.email || 'No email provided',
          phone: data.personalInformation?.phoneNumber || 'No phone provided',
          skills: data.skillExtraction?.extractedSkills || [],
          job_applied: selectedRole,
          resume_status: 'Parsed',
          form_status: 'N/A',
          video_status: 'Pending',
          tech_status: 'Pending',
          report_status: 'Not Shared',
          stage: 'Resume Upload',
          resume_score: Math.round(75 + (data.totalExperienceAnalysis?.domainExperience || 0) * 2 + Math.random() * 5),
          extracted_data: {
            ...data,
            _reportShareToken: reportToken,
            _reportShareExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        };

        const dbRes = await apiFetch('/api/candidates', {
          method: 'POST',
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
      console.error('Upload catch block:', err);
      setStatus({ 
        type: 'error', 
        message: err.message || 'Could not reach the parsing server. Please try again.' 
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
      
      {confirmModal && (
        <ConfirmActionModal
          title={confirmModal.type === 'approve' ? 'Approve Resume' : 'Reject Resume'}
          message={confirmModal.type === 'approve' 
            ? `Are you sure you want to approve ${confirmModal.candidate.name}'s resume? This will move them to the Video Bot Screening stage.`
            : `Are you sure you want to reject ${confirmModal.candidate.name}'s resume?`
          }
          confirmLabel={confirmModal.type === 'approve' ? 'Approve' : 'Reject'}
          onConfirm={(reason) => handleWorkflowAction(confirmModal.candidate, confirmModal.type, reason)}
          onCancel={() => setConfirmModal(null)}
          danger={confirmModal.type === 'reject'}
          requireReason={confirmModal.type === 'reject'}
          reasonPlaceholder="Enter rejection reason..."
          loading={actionLoading === confirmModal.candidate.id}
        />
      )}


      {/* Upload Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Upload Resumes</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Select a Department and Sub Department and upload applicant resumes for AI parsing.</p>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
              <label className="form-label">Select Department <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select 
                className="form-select" 
                value={selectedDepartment} 
                onChange={(e) => {
                  const newDept = e.target.value;
                  setSelectedDepartment(newDept);
                  setSelectedSubDepartment('');
                  setSelectedRole('');
                  setStatus({ type: '', message: '' });
                }}
              >
                <option value="">-- Choose Department --</option>
                {dynamicDepartments.map(dept => (
                  <option key={dept as string} value={dept as string}>{dept as string}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Select Sub Department <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select 
                className="form-select" 
                value={selectedSubDepartment} 
                onChange={(e) => {
                  const newSub = e.target.value;
                  setSelectedSubDepartment(newSub);
                  setSelectedRole('');
                  setStatus({ type: '', message: '' });
                }}
                disabled={!selectedDepartment}
              >
                <option value="">-- Choose Sub Department --</option>
                {selectedDepartment && getAvailableSubDepartments(selectedDepartment).map(subDept => (
                  <option key={subDept as string} value={subDept as string}>{subDept as string}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Select Role <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select 
                className="form-select" 
                value={selectedRole} 
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setStatus({ type: '', message: '' });
                }}
                disabled={!selectedSubDepartment}
              >
                <option value="">-- Choose Role --</option>
                {selectedSubDepartment && getAvailableRoles(selectedDepartment, selectedSubDepartment).map(r => (
                  <option key={r as string} value={r as string}>{r as string}</option>
                ))}
              </select>
            </div>
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
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="card-header flex justify-between items-center">
          <h3 className="card-title">Parsed Candidates</h3>
        </div>
        <div className="table-container" style={{ overflow: 'visible' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Candidate Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No candidates found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(candidate => (
                  <tr key={candidate.id}>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--brand-green)', backgroundColor: 'rgba(125, 186, 0, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                        #{candidate.display_id || candidate.unique_id || String(candidate.id).substring(0,6)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(14, 45, 123, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)', fontWeight: '700', fontSize: '0.875rem' }}>
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            {candidate.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>{candidate.email}</td>
                    <td>{candidate.jobApplied}</td>
                    <td>
                      <WorkflowBadge status={candidate.resume_stage_status || candidate.resumeStageStatus || 'Pending'} size="sm" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          View
                        </button>
                        
                        {(candidate.resume_stage_status || candidate.resumeStageStatus || 'Pending') === 'Pending' && (
                          <>
                            <button
                              onClick={() => setConfirmModal({ type: 'approve', candidate })}
                              disabled={actionLoading === candidate.id}
                              title="Approve Resume"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                border: 'none',
                                borderRadius: '6px',
                                background: '#10b981',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <CheckSquare size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmModal({ type: 'reject', candidate })}
                              disabled={actionLoading === candidate.id}
                              title="Reject Resume"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                border: 'none',
                                borderRadius: '6px',
                                background: '#ef4444',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <XSquare size={12} />
                              Reject
                            </button>
                          </>
                        )}
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="btn btn-ghost dropdown-trigger" 
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === candidate.id ? null : candidate.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeDropdown === candidate.id && (
                            <div 
                              className="dropdown-menu"
                              style={{ 
                                position: 'absolute', 
                                right: 0, 
                                top: '100%', 
                                backgroundColor: 'var(--surface)', 
                                border: '1px solid var(--border)', 
                                borderRadius: 'var(--radius-md)', 
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
                                zIndex: 50,
                                minWidth: '150px',
                                padding: '0.375rem 0'
                              }}
                            >
                              <button 
                                style={{ 
                                  width: '100%', 
                                  textAlign: 'left', 
                                  padding: '0.5rem 1rem', 
                                  fontSize: '0.875rem', 
                                  color: 'var(--brand-navy)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                                className="hover:bg-gray-50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(null);
                                  const shareUrl = `${window.location.origin.replace('5173', '3000')}/resume/share/${candidate.id}`;
                                  if (navigator.clipboard && window.isSecureContext) {
                                    navigator.clipboard.writeText(shareUrl).then(() => {
                                      setStatus({ type: 'success', message: 'Read-only resume link copied to clipboard!' });
                                      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
                                    }).catch(err => {
                                      prompt("Copy this link to share:", shareUrl);
                                    });
                                  } else {
                                    prompt("Copy this link to share:", shareUrl);
                                  }
                                }}
                              >
                                <Share2 size={14} /> Share Resume
                              </button>
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
                                      const res = await apiFetch(`/api/candidates?id=${candidate.id}`, {
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

      {/* Details Modal (Standard Resume) */}
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
          <StandardResume 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
            onUpdate={refreshCandidates} 
          />
        </div>
      )}



    </div>
  );
};

export default ResumeUpload;
