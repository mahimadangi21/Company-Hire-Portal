import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, FileSpreadsheet, Video, Calendar, BarChart, History, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Job Postings', path: '/jobs', icon: Briefcase },
    { name: 'Resume Upload', path: '/resumes', icon: FileText },
    { name: 'Candidate Forms', path: '/forms', icon: FileSpreadsheet },
    { name: 'Video Bot Interview', path: '/video-bot', icon: Video },
    { name: 'Technical Scheduler', path: '/scheduler', icon: Calendar },
    { name: 'Reports', path: '/reports', icon: BarChart },
    { name: 'Email History', path: '/emails', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside style={{ 
      width: '260px', 
      backgroundColor: 'var(--brand-navy)', 
      color: 'white',
      display: 'flex', 
      flexDirection: 'column',
      boxShadow: '4px 0 15px rgba(14,45,123,0.1)'
    }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src="https://thoughtleadership.kadellabs.com/wp-content/uploads/2023/09/log-kl.png" 
          alt="KadelLabs Logo" 
          style={{ height: '36px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
        />
      </div>
      
      <nav style={{ flex: 1, padding: '1.5rem 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
              backgroundColor: isActive ? 'rgba(125, 186, 0, 0.2)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--brand-green)' : '3px solid transparent',
              fontWeight: isActive ? '600' : '500',
              transition: 'all 0.2s ease',
              textDecoration: 'none'
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} color={isActive ? 'var(--brand-green)' : 'rgba(255,255,255,0.7)'} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'rgba(255,255,255,0.7)', padding: '0.75rem' }}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
