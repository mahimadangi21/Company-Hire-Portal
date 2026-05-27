import { Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Navbar = ({ title }) => {
  const { notifications } = useAppContext();
  const unreadCount = notifications.filter(n => !n.read).length;

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
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--brand-navy)' }}>Admin User</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@kadellabs.com</div>
          </div>
          <div style={{ 
            width: '40px', height: '40px', 
            background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1a42a3 100%)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: '600', color: 'white',
            boxShadow: '0 2px 5px rgba(14, 45, 123, 0.2)'
          }}>
            AU
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
