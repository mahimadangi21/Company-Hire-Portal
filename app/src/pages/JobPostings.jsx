import React, { useState } from 'react';
import { Plus, Edit2, Archive } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const JobPostings = () => {
  const { jobs, refreshJobs } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublishJob = async () => {
    if (!title.trim() || !department) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, department })
      });

      if (res.ok) {
        setTitle('');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="flex justify-between items-center">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Job Listed</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Create New Job
        </button>
      </div>

      {showForm && (
        <div className="card animate-slide-up" style={{ backgroundColor: 'var(--gray-50)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.125rem' }}>New Job Configuration</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Senior Frontend Engineer" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option>Engineering</option>
                  <option>Product</option>
                  <option>Design</option>
                  <option>Marketing</option>
                </select>
              </div>
            </div>
             <div className="flex gap-4">
              <button 
                className="btn btn-primary" 
                onClick={handlePublishJob}
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Job'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Status</th>
                <th>Candidates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No jobs found. Create one!
                  </td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: '500' }}>{job.title}</td>
                    <td>{job.department}</td>
                    <td><span className="badge badge-success">{job.status || 'Active'}</span></td>
                    <td>{job.applicants || 0} applied</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost" style={{ padding: '0.25rem' }}><Edit2 size={16} /></button>
                        <button className="btn btn-ghost" style={{ padding: '0.25rem', color: 'var(--warning)' }}><Archive size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobPostings;
