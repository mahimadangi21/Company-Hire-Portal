import React from 'react';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

const EmailHistory = () => {
  const emails = [
    { id: 1, recipient: 'alice@example.com', job: 'Senior Frontend Engineer', type: 'Form Link', sentOn: '2026-05-25 10:00 AM', status: 'Delivered' },
    { id: 2, recipient: 'bob@example.com', job: 'Product Manager', type: 'Form Link', sentOn: '2026-05-25 11:30 AM', status: 'Delivered' },
    { id: 3, recipient: 'alice@example.com', job: 'Senior Frontend Engineer', type: 'Video Interview Link', sentOn: '2026-05-26 09:15 AM', status: 'Delivered' },
    { id: 4, recipient: 'charlie@example.com', job: 'Designer', type: 'Report Share', sentOn: '2026-05-26 10:45 AM', status: 'Failed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="card-title">SMTP Email Logs</h3>
          <div className="flex gap-4">
            <select className="form-select" style={{ width: '150px' }}>
              <option>All Types</option>
              <option>Form Link</option>
              <option>Interview Link</option>
              <option>Report Share</option>
            </select>
          </div>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Job Role</th>
                <th>Email Type</th>
                <th>Sent On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {emails.map(email => (
                <tr key={email.id}>
                  <td style={{ fontWeight: '500' }}>{email.recipient}</td>
                  <td>{email.job}</td>
                  <td>{email.type}</td>
                  <td>{email.sentOn}</td>
                  <td>
                    {email.status === 'Delivered' ? (
                      <span className="badge badge-success" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', width: 'fit-content' }}>
                        <CheckCircle size={12}/> Delivered
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', width: 'fit-content' }}>
                        <XCircle size={12}/> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailHistory;
