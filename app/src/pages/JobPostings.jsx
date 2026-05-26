import React, { useState } from 'react';
import { Plus, Edit2, Archive } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const JobPostings = () => {
  const { jobs } = useAppContext();
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="flex justify-between items-center">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Job Postings</h2>
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
                <input type="text" className="form-input" placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select">
                  <option>Engineering</option>
                  <option>Product</option>
                  <option>Design</option>
                  <option>Marketing</option>
                </select>
              </div>
            </div>
             <div className="flex gap-4">
              <button className="btn btn-primary">Publish Job</button>
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
              {jobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: '500' }}>{job.title}</td>
                  <td>{job.department}</td>
                  <td><span className="badge badge-success">{job.status}</span></td>
                  <td>{job.applicants} applied</td>
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
    </div>
  );
};

export default JobPostings;
