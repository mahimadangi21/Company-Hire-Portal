import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/jobs': return 'Job Listed';
      case '/resumes': return 'Resume Upload & Parsing';
      case '/forms': return 'Candidate Forms';
      case '/video-bot': return 'Video Bot Screening';
      case '/scheduler': return 'Technical Interview Scheduler';
      case '/reports': return 'Reports & Evaluation';
      case '/emails': return 'Email & Notification History';
      case '/settings': return 'System Settings';
      default: return 'InterviewOS';
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar title={getPageTitle()} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--background)' }}>
          <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
