"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    switch(pathname) {
      case '/admin': return 'Dashboard Overview';
      case '/admin/jobs': return 'Department';
      case '/admin/resumes': return 'Resume Upload & Parsing';
      case '/admin/video-bot': return 'Video Bot Screening';
      case '/admin/scheduler': return 'Technical Interview Scheduler';
      case '/admin/reports': return 'Reports & Evaluation';
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
