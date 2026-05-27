import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const NEXT_JS_URL = 'http://localhost:3000';

const QuestionBankModal = ({ onClose }) => {
  const { jobs } = useAppContext();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newDepartment, setNewDepartment] = useState('Technology and Delivery');
  const [newSubDepartment, setNewSubDepartment] = useState('PHP');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  
  // Unique departments combined from existing questions
  const allDepartments = [...new Set(questions.map(q => q.department || 'General'))].filter(Boolean);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSubDepartment, setSelectedSubDepartment] = useState('');
  // Define some default examples as requested
  const DEFAULT_DEPARTMENTS = ['Technology and Delivery', 'Engineering', 'HR', 'Marketing'];
  const DEFAULT_SUB_DEPARTMENTS = {
    'Technology and Delivery': ['PHP', 'QA', 'Frontend', 'Backend'],
    'Engineering': ['DevOps', 'Data Science', 'SRE'],
    'HR': ['Recruitment', 'Operations'],
    'Marketing': ['SEO', 'Content', 'Social Media']
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (allDepartments.length > 0 && !selectedDepartment) {
      setSelectedDepartment(allDepartments[0]);
    }
  }, [questions]);

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
          department: newDepartment,
          sub_department: newSubDepartment,
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

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`${NEXT_JS_URL}/api/questions?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchQuestions();
      } else {
        alert("Failed to delete question");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting question");
    }
  };

  const filteredQuestions = questions.filter(q => 
    (!selectedDepartment || (q.department || 'General') === selectedDepartment) &&
    (!selectedSubDepartment || (q.sub_department || 'General') === selectedSubDepartment)
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Manage Question Bank</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--gray-500)"/></button>
        </div>
        
        <div className="card-body">
          {/* Add New Section */}
          <div style={{ backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Question</h4>
            
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department</label>
                <select 
                  className="form-select" 
                  value={newDepartment}
                  onChange={e => {
                    setNewDepartment(e.target.value);
                    const subs = DEFAULT_SUB_DEPARTMENTS[e.target.value] || ['General'];
                    setNewSubDepartment(subs[0]);
                  }}
                >
                  {DEFAULT_DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sub-Department</label>
                <select 
                  className="form-select"
                  value={newSubDepartment}
                  onChange={e => setNewSubDepartment(e.target.value)}
                >
                  {(DEFAULT_SUB_DEPARTMENTS[newDepartment] || ['General']).map(sd => (
                    <option key={sd} value={sd}>{sd}</option>
                  ))}
                </select>
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
              
              <button className="btn btn-primary" onClick={handleAddQuestion} disabled={!newQuestionText.trim()}>
                <Plus size={16} /> Add Question
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Existing Questions</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.75rem', fontSize: '0.875rem' }}
                value={selectedDepartment}
                onChange={e => {
                  setSelectedDepartment(e.target.value);
                  setSelectedSubDepartment('');
                }}
              >
                <option value="">All Departments</option>
                {allDepartments.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {selectedDepartment && DEFAULT_SUB_DEPARTMENTS[selectedDepartment] && (
                <select 
                  className="form-select" 
                  style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.75rem', fontSize: '0.875rem' }}
                  value={selectedSubDepartment}
                  onChange={e => setSelectedSubDepartment(e.target.value)}
                >
                  <option value="">All Sub-Departments</option>
                  {DEFAULT_SUB_DEPARTMENTS[selectedDepartment].map(sd => (
                    <option key={sd} value={sd}>{sd}</option>
                  ))}
                </select>
              )}
            </div>
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
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {q.is_mandatory && <span className="badge badge-success">Mandatory</span>}
                      <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{q.department || 'General'}</span>
                      <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{q.sub_department || 'General'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteQuestion(q.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: 'var(--danger)', 
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                  </button>
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
