import React from 'react';
import { Save, Server, Users, Bell } from 'lucide-react';

const Settings = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      
      <div className="card">
        <div className="card-header flex items-center gap-3">
          <Server size={20} color="var(--primary)" />
          <h3 className="card-title">SMTP Email Configuration</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input type="text" className="form-input" defaultValue="smtp.sendgrid.net" />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input type="text" className="form-input" defaultValue="587" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-input" defaultValue="apikey" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" defaultValue="••••••••••••••••" />
            </div>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-primary">Save Settings</button>
            <button className="btn btn-outline">Test Connection</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-3">
          <Bell size={20} color="var(--primary)" />
          <h3 className="card-title">Link Expiry Defaults</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Candidate Form Link Expiry</label>
              <select className="form-select">
                <option>24 Hours</option>
                <option>48 Hours</option>
                <option>7 Days</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Video Interview Link Expiry</label>
              <select className="form-select">
                <option>24 Hours</option>
                <option>48 Hours</option>
                <option selected>7 Days</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary">Save Defaults</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-3">
          <Users size={20} color="var(--primary)" />
          <h3 className="card-title">Panelist Pool Management</h3>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Manage the list of available panelists for technical interviews.</p>
          <button className="btn btn-outline"><Users size={16} /> Manage Panelists</button>
        </div>
      </div>

    </div>
  );
};

export default Settings;
