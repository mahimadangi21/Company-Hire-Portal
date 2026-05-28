"use client";

import { Search, LogOut } from 'lucide-react';
import { useAppContext } from '@/components/admin/context/AppContext';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DASHBOARD_EMAIL || 'careers@kadellabs.com';

const Navbar = ({ title }) => {
  const { notifications } = useAppContext();
  const unreadCount = notifications.filter(n => !n.read).length;
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'kl_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  return (
    <header style={{
      height: '73px',
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem'
    }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--brand-navy)' }}>{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            type="text"
            placeholder="Search candidates, jobs..."
            className="form-input"
            style={{
              paddingLeft: '2.75rem',
              width: '320px',
              borderRadius: '9999px',
              backgroundColor: 'var(--gray-50)',
              border: '1px solid transparent',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--brand-navy)' }}>Admin</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ADMIN_EMAIL}</div>
          </div>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1a42a3 100%)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '600', color: 'white',
            boxShadow: '0 2px 5px rgba(14, 45, 123, 0.2)'
          }}>
            KL
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--gray-500)',
              padding: '0.4rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray-500)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
