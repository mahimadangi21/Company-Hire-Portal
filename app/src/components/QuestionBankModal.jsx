import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save } from 'lucide-react';

const NEXT_JS_URL = 'http://localhost:3000';

const QuestionBankModal = ({ onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newRole, setNewRole] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  
  // Unique job roles from the DB
  const jobRoles = [...new Set(questions.map(q => q.job_role))];
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${NEXT_JS_URL}/api/questions`);
      const data = await res.json();
      setQuestions(data || []);
      if (data && data.length > 0 && !selectedRole) {
        setSelectedRole([...new Set(data.map(q => q.job_role))][0]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    const targetRole = newRole.trim() || selectedRole;
    if (!targetRole || !newQuestionText.trim()) return;

    try {
      const res = await fetch(`${NEXT_JS_URL}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_role: targetRole,
          question_text: newQuestionText.trim(),
          is_mandatory: isMandatory
        })
      });
      if (res.ok) {
        setNewQuestionText('');
        setNewRole('');
        setIsMandatory(false);
        fetchQuestions();
        setSelectedRole(targetRole);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredQuestions = questions.filter(q => q.job_role === selectedRole);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Manage Question Bank</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--gray-500)"/></button>
        </div>
        
        <div className="card-body">
          {/* Add New Section */}
          <div style={{ backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Question</h4>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Job Role</label>
                <select 
                  className="form-select" 
                  value={newRole ? '' : selectedRole} 
                  onChange={e => setSelectedRole(e.target.value)}
                  disabled={!!newRole}
                >
                  <option value="">Select Existing Role...</option>
                  {jobRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Or Create New Role</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Frontend Developer" 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Question Text</label>
              <textarea 
                className="form-input" 
                rows="2" 
                value={newQuestionText}
                onChange={e => setNewQuestionText(e.target.value)}
                placeholder="What is your experience with React?"
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isMandatory}
                  onChange={e => setIsMandatory(e.target.checked)}
                />
                Make this a mandatory question
              </label>
              
              <button className="btn btn-primary" onClick={handleAddQuestion} disabled={!newQuestionText.trim() || (!newRole && !selectedRole)}>
                <Plus size={16} /> Add Question
              </button>
            </div>
          </div>

          {/* List Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Existing Questions</h4>
            <select 
              className="form-select" 
              style={{ width: '200px' }}
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              {jobRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Loading...</div>
          ) : filteredQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
              No questions found for this role. Add one above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredQuestions.map((q, i) => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block' }}>Q{i+1}. {q.question_text}</span>
                    {q.is_mandatory && <span className="badge badge-success" style={{ marginTop: '0.25rem' }}>Mandatory</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBankModal;
