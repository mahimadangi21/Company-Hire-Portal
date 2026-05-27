import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, FileSpreadsheet, Video, Calendar, BarChart, History, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Job Listed', path: '/jobs', icon: Briefcase },
    { name: 'Resume Upload', path: '/resumes', icon: FileText },
    { name: 'Candidate Forms', path: '/forms', icon: FileSpreadsheet },
    { name: 'Video Bot Screening', path: '/video-bot', icon: Video },
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
      <div style={{ 
        padding: '1.25rem 1.5rem', 
        backgroundColor: '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid rgba(14, 45, 123, 0.1)'
      }}>
        <img 
          src="/kadellabs-logo.png" 
          alt="KadelLabs Logo" 
          style={{ height: '38px', objectFit: 'contain' }}
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
        <button 
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
          className="btn" 
          style={{ 
            width: '100%', 
            justifyContent: 'flex-start', 
            color: isLogoutHovered ? 'white' : 'rgba(255,255,255,0.7)', 
            backgroundColor: isLogoutHovered ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            padding: '0.75rem',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <LogOut size={20} color={isLogoutHovered ? 'var(--danger)' : 'rgba(255,255,255,0.7)'} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
