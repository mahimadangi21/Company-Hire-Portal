import React, { useState, useRef } from 'react';
import { Edit2, Save, Printer, Download, Share2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const StandardResume = ({ candidate, onClose, onUpdate, readOnly = false }) => {
  const { apiFetch } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const printRef = useRef(null);

  // Local state for editing
  const [name, setName] = useState(candidate?.name || '');
  const [skills, setSkills] = useState(candidate?.skills ? candidate.skills.join(', ') : '');
  
  const extractedData = candidate?.extractedData || {};
  const [expTotal, setExpTotal] = useState(extractedData?.totalExperienceAnalysis?.totalExperience || '');
  const [expDomain, setExpDomain] = useState(extractedData?.totalExperienceAnalysis?.domainExperience || '0');
  const [expLeadership, setExpLeadership] = useState(extractedData?.totalExperienceAnalysis?.leadershipExperience || '0');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      
      const updatedExtractedData = {
        ...extractedData,
        totalExperienceAnalysis: {
          ...extractedData.totalExperienceAnalysis,
          totalExperience: expTotal,
          domainExperience: expDomain,
          leadershipExperience: expLeadership,
        }
      };

      const res = await apiFetch('/api/candidates', {
        method: 'PATCH',
        body: JSON.stringify({
          id: candidate.id,
          name,
          skills: skillsArray,
          extracted_data: updatedExtractedData
        })
      });

      if (res.ok) {
        setIsEditing(false);
        if (onUpdate) onUpdate();
      } else {
        alert("Failed to save changes");
      }
    } catch (e) {
      alert("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!candidate) return null;

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      borderRadius: 'var(--radius-xl)',
      width: '100%',
      maxWidth: '900px',
      maxHeight: readOnly ? 'none' : '90vh',
      boxShadow: readOnly ? 'none' : 'var(--shadow-xl)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: readOnly ? 'none' : '1px solid var(--border)'
    }} onClick={(e) => e.stopPropagation()}>
      
      {/* Modal Header (Hidden during print) */}
      {!readOnly && (
        <div className="print-hide" style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafb'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--brand-navy)' }}>
              Standardized Candidate Resume
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Optimized for <strong style={{ color: 'var(--brand-green)' }}>{candidate.jobApplied}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Printer size={16} /> Print / PDF
            </button>
            {isEditing ? (
              <button onClick={handleSave} disabled={isSaving} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Edit2 size={16} /> Edit Resume
              </button>
            )}
            {onClose && (
              <button onClick={onClose} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                color: 'var(--gray-400)', width: '32px', height: '32px', borderRadius: '50%'
              }}>&times;</button>
            )}
          </div>
        </div>
      )}

      {/* Printable Area */}
      <div className="print-area" ref={printRef} style={{ padding: '3rem', overflowY: 'auto', flex: 1, backgroundColor: '#fff', color: '#333' }}>
        
        {/* Header / Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--brand-navy)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            {isEditing ? (
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--brand-navy)', border: '1px solid #ccc', borderRadius: '4px', padding: '0.25rem', width: '100%', marginBottom: '0.5rem' }} 
              />
            ) : (
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--brand-navy)', margin: 0, lineHeight: 1.2 }}>
                {name.toUpperCase()}
              </h1>
            )}
            <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', fontWeight: '600', margin: '0.5rem 0 0 0' }}>
              {candidate.jobApplied} Candidate
            </p>
          </div>
          <div>
            <img src="/kadellabs-logo.png" alt="Kadel Labs" style={{ height: '40px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Note: Contact details omitted intentionally */}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Experience Summary */}
            <section>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Experience Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Total Experience:</span>
                  {isEditing ? (
                    <input type="text" value={expTotal} onChange={e => setExpTotal(e.target.value)} style={{ width: '80px', padding: '2px 4px' }} />
                  ) : (
                    <strong style={{ color: '#333' }}>{expTotal || 'N/A'}</strong>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Domain Experience:</span>
                  {isEditing ? (
                    <input type="text" value={expDomain} onChange={e => setExpDomain(e.target.value)} style={{ width: '80px', padding: '2px 4px' }} />
                  ) : (
                    <strong style={{ color: '#333' }}>{expDomain} years</strong>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Leadership:</span>
                  {isEditing ? (
                    <input type="text" value={expLeadership} onChange={e => setExpLeadership(e.target.value)} style={{ width: '80px', padding: '2px 4px' }} />
                  ) : (
                    <strong style={{ color: '#333' }}>{expLeadership || '0 years'}</strong>
                  )}
                </div>
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Core Competencies
              </h2>
              {isEditing ? (
                <textarea 
                  value={skills} 
                  onChange={e => setSkills(e.target.value)} 
                  rows={4}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="Comma separated skills"
                />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {skills.split(',').filter(Boolean).map((skill, i) => (
                    <span key={i} style={{ 
                      backgroundColor: 'rgba(14, 45, 123, 0.05)', 
                      color: 'var(--brand-navy)', 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Project Highlights */}
            <section>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Project Highlights
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {extractedData?.projectAnalysis && extractedData.projectAnalysis.length > 0 ? (
                  extractedData.projectAnalysis.map((proj, i) => (
                    <div key={i}>
                      <h4 style={{ fontWeight: '700', fontSize: '1rem', color: '#111', marginBottom: '0.25rem' }}>
                        {proj.projectName || 'Unnamed Project'}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.6, margin: 0 }}>
                        {proj.projectDescription || 'No description provided.'}
                      </p>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                          <strong>Technologies: </strong> {proj.techStack.join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontStyle: 'italic', color: '#888', fontSize: '0.9rem' }}>No project history available.</p>
                )}
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Education
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {extractedData?.educationDetails && extractedData.educationDetails.length > 0 ? (
                  extractedData.educationDetails.map((edu, i) => (
                    <div key={i}>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111', margin: 0 }}>
                        {edu.degree || 'Degree details N/A'}
                      </h4>
                      <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.25rem' }}>
                        {edu.college || 'Institution N/A'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '0.125rem' }}>
                        {edu.passingYear && `Class of ${edu.passingYear}`} {edu.cgpaOrPercentage && `| ${edu.cgpaOrPercentage}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontStyle: 'italic', color: '#888', fontSize: '0.9rem' }}>No education records available.</p>
                )}
              </div>
            </section>

          </div>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>
          This resume was automatically generated and standardized via Kadel Labs Interview Platform. <br/>
          Contact details have been omitted for unbiased screening.
        </div>
      </div>

    </div>
  );
};

export default StandardResume;
