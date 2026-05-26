import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      navigate('/');
    }
  };

  return (
    <div className="auth-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10, padding: '1rem' }}>
        <div className="card-header" style={{ textAlign: 'center', borderBottom: 'none', paddingBottom: '0' }}>
          <img 
            src="https://thoughtleadership.kadellabs.com/wp-content/uploads/2023/09/log-kl.png" 
            alt="KadelLabs Logo" 
            style={{ height: '48px', margin: '0 auto 1.5rem', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--brand-navy)' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sign in to the Admin Dashboard</p>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="admin@kadellabs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.375rem' }}>
                <label className="form-label" style={{ marginBottom: '0' }}>Password</label>
                <a href="#" style={{ fontSize: '0.75rem', color: 'var(--brand-navy)', fontWeight: '600', transition: 'color 0.2s' }}>Forgot password?</a>
              </div>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
