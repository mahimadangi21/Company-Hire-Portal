import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, Folder, Subtitles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const JobPostings = () => {
  const { jobs, refreshJobs } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshJobs();
  }, []);

  // Get unique list of existing parent departments
  const uniqueDepartments = Array.from(new Set(jobs.map(job => job.department).filter(Boolean)));

  const handlePublishJob = async () => {
    if (!title.trim() || !department.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, department })
      });

      if (res.ok) {
        setTitle('');
        setDepartment('');
        setShowForm(false);
        refreshJobs(); // Reload jobs from Supabase
      } else {
        const err = await res.json();
        alert(err.error || "Failed to publish job");
      }
    } catch (e) {
      alert("Error publishing job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group jobs by department
  const groupedDepartments = jobs.reduce((acc, job) => {
    const dept = job.department || 'Unassigned';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(job);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--brand-navy)' }}>Department Hierarchy</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage parent Departments and their Sub-Departments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Create New Department Configuration
        </button>
      </div>

      {showForm && (
        <div className="card animate-slide-up" style={{ backgroundColor: 'var(--gray-50)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.125rem' }}>New Department Configuration</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Parent Department</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Engineering, Sales, Product" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  list="departments-list"
                />
                <datalist id="departments-list">
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type to create a new department or select an existing one.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-Department</label>
                 <input
                   type="text"
                   className="form-input"
                   placeholder="e.g. Frontend, Backend, UI/UX"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                 />
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>The sub-department under the parent department.</span>
              </div>
            </div>
             <div className="flex gap-4">
              <button 
                className="btn btn-primary" 
                onClick={handlePublishJob}
                disabled={isSubmitting || !title.trim() || !department.trim()}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Department'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {Object.keys(groupedDepartments).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No departments configured. Click "Create New Department Configuration" to get started!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(groupedDepartments).map(([deptName, subDepts]) => (
            <div key={deptName} className="card" style={{ borderLeft: '4px solid var(--primary-color, #3b82f6)' }}>
              <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div className="flex items-center gap-2">
                  <Folder size={20} style={{ color: 'var(--primary-color, #3b82f6)' }} />
                  <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: '600' }}>{deptName}</h3>
                  <span className="badge" style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-main)', marginLeft: '0.5rem' }}>
                    {subDepts.length} {subDepts.length === 1 ? 'Sub-Department' : 'Sub-Departments'}
                  </span>
                </div>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '1.5rem' }}>Sub-Department Title</th>
                      <th>Status</th>
                      <th>Candidates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subDepts.map(job => (
                      <tr key={job.id}>
                        <td style={{ fontWeight: '500', paddingLeft: '1.5rem' }}>{job.title}</td>
                        <td><span className="badge badge-success">{job.status || 'Active'}</span></td>
                        <td>{job.applicants || 0} applied</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost" style={{ padding: '0.25rem' }}><Edit2 size={16} /></button>
                            <button className="btn btn-ghost" style={{ padding: '0.25rem', color: 'var(--warning)' }}><Archive size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobPostings;
