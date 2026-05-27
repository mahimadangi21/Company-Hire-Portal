import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const NEXT_JS_URL = 'http://localhost:3000';

const QuestionBankModal = ({ onClose }) => {
  const { jobs } = useAppContext();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newRole, setNewRole] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  
  // Unique job roles combined from existing questions and jobs database
  const allRoles = [...new Set([
    ...questions.map(q => q.job_role),
    ...jobs.map(j => j.title)
  ])].filter(Boolean);
  
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Set default selected role once roles list is loaded
  useEffect(() => {
    if (allRoles.length > 0 && !selectedRole) {
      setSelectedRole(allRoles[0]);
    }
  }, [questions, jobs]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${NEXT_JS_URL}/api/questions`);
      const data = await res.json();
      setQuestions(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) return;

    try {
      const res = await fetch(`${NEXT_JS_URL}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_role: 'Common',
          question_text: newQuestionText.trim(),
          is_mandatory: isMandatory
        })
      });
      if (res.ok) {
        setNewQuestionText('');
        setIsMandatory(false);
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredQuestions = questions;

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
            {/* Job role input removed for common question bank */}
            
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
              
              <button className="btn btn-primary" onClick={handleAddQuestion} disabled={!newQuestionText.trim()}>
                <Plus size={16} /> Add Question
              </button>
            </div>
          </div>

          {/* List Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Existing Questions</h4>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Loading...</div>
          ) : filteredQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
              No questions found. Add one above!
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
