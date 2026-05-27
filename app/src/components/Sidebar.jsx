import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, Video, Calendar, BarChart, LogOut } from 'lucide-react';

const Sidebar = () => {
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Job Listed', path: '/jobs', icon: Briefcase },
    { name: 'Resume Upload', path: '/resumes', icon: FileText },
    { name: 'Video Bot Screening', path: '/video-bot', icon: Video },
    { name: 'Technical Scheduler', path: '/scheduler', icon: Calendar },
    { name: 'Reports', path: '/reports', icon: BarChart },
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
        height: '92px', 
        backgroundColor: '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem'
      }}>
        <img 
          src="https://kadellabs.com/wp-content/uploads/2024/08/KL-blue-1-1.svg" 
          alt="KadelLabs Logo" 
          style={{ height: '54px', objectFit: 'contain' }}
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
        {/* Spacer to push Logout to the bottom of the nav container */}
        <div style={{ flex: 1 }} />
        
        {/* Divider above Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

        <button 
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
          style={{ 
            width: '100%', 
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isLogoutHovered ? 'white' : 'rgba(255,255,255,0.7)', 
            backgroundColor: isLogoutHovered ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            borderLeft: '3px solid transparent',
            border: 'none',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          <LogOut size={20} color={isLogoutHovered ? 'var(--danger)' : 'rgba(255,255,255,0.7)'} />
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
