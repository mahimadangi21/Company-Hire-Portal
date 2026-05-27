import React, { useEffect } from 'react';
import { Users, FileText, CheckCircle, Video, Calendar, BarChart2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Dashboard = () => {
  const { candidates, jobs, refreshCandidates, refreshJobs } = useAppContext();

  useEffect(() => {
    refreshCandidates();
    refreshJobs();
  }, []);

  const analytics = [
    { title: 'Total Candidates', value: candidates.length, icon: Users, color: 'var(--brand-navy)', bg: 'rgba(14, 45, 123, 0.08)' },
    { title: 'Resumes Parsed', value: candidates.filter(c => c.resumeStatus === 'Parsed').length, icon: FileText, color: 'var(--info)', bg: 'var(--info-bg)' },
    { title: 'Forms Submitted', value: candidates.filter(c => c.formStatus === 'Submitted').length, icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
    { title: 'Screening Completed', value: candidates.filter(c => c.videoStatus === 'Completed').length, icon: Video, color: 'var(--brand-green)', bg: 'rgba(125, 186, 0, 0.15)' },
    { title: 'Tech Interviews', value: candidates.filter(c => c.techStatus === 'Scheduled' || c.techStatus === 'Completed').length, icon: Calendar, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { title: 'Reports Generated', value: candidates.filter(c => c.reportStatus !== 'Not Shared').length, icon: BarChart2, color: 'var(--gray-600)', bg: 'var(--gray-100)' }
  ];

  const stages = [
    { name: 'Resume Upload', count: candidates.length },
    { name: 'Resume Parsing', count: candidates.filter(c => c.resumeStatus === 'Parsed').length },
    { name: 'Candidate Form', count: candidates.filter(c => c.formStatus === 'Submitted').length },
    { name: 'Video Bot', count: candidates.filter(c => c.videoStatus === 'Completed').length },
    { name: 'Tech Schedule', count: candidates.filter(c => c.techStatus === 'Scheduled').length },
    { name: 'Report Gen', count: candidates.filter(c => c.reportStatus !== 'Not Shared').length }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-3 gap-6">
        {analytics.map((stat, idx) => (
          <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.025em' }}>{stat.title}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--text-main)' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Tracker */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recruitment Pipeline</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', paddingTop: '1rem', paddingBottom: '0.5rem' }}>
            {/* Connecting Line */}
            <div style={{ position: 'absolute', top: '2rem', left: '5%', right: '5%', height: '3px', backgroundColor: 'var(--gray-200)', zIndex: 0, borderRadius: '4px' }}></div>
            
            {stages.map((stage, idx) => {
              const isActive = stage.count > 0;
              return (
                <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '120px' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    backgroundColor: isActive ? 'var(--brand-green)' : 'var(--surface)', 
                    border: isActive ? '3px solid white' : '3px solid var(--gray-300)',
                    boxShadow: isActive ? '0 0 0 3px rgba(125, 186, 0, 0.3)' : 'none',
                    color: isActive ? 'white' : 'var(--gray-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: isActive ? 'var(--brand-navy)' : 'var(--text-muted)' }}>{stage.name}</p>
                    <span className="badge badge-gray" style={{ marginTop: '0.375rem' }}>{stage.count} Candidates</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Active Jobs Quick View */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Active Departments Listed</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Department Title</th>
                <th>Department</th>
                <th>Candidates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: '600', color: 'var(--brand-navy)' }}>{job.title}</td>
                  <td>{job.department}</td>
                  <td>{job.applicants} applied</td>
                  <td><span className="badge badge-success">{job.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
