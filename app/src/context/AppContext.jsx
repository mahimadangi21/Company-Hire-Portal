import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [jobs, setJobs] = useState([
    { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', questions: 7, status: 'Active', applicants: 12, date: '2026-05-20' },
    { id: 2, title: 'Product Manager', department: 'Product', questions: 5, status: 'Active', applicants: 8, date: '2026-05-22' }
  ]);

  const [candidates, setCandidates] = useState([
    { id: 1, name: 'Alice Smith', email: 'alice@example.com', phone: '+1 234 567 8900', skills: ['React', 'TypeScript'], jobApplied: 'Senior Frontend Engineer', resumeStatus: 'Parsed', formStatus: 'Submitted', videoStatus: 'Completed', techStatus: 'Scheduled', reportStatus: 'Shared', stage: 'Technical Interview', resumeScore: 85, videoScore: 90, techScore: 88, finalRecommendation: 'Selected' },
    { id: 2, name: 'Bob Jones', email: 'bob@example.com', phone: '+1 987 654 3210', skills: ['Product Strategy', 'Agile'], jobApplied: 'Product Manager', resumeStatus: 'Parsed', formStatus: 'Pending', videoStatus: 'Pending', techStatus: 'Pending', reportStatus: 'Not Shared', stage: 'Candidate Form', resumeScore: 78, videoScore: null, techScore: null, finalRecommendation: 'Under Review' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New resume uploaded for Frontend Engineer', time: '5m ago', read: false },
    { id: 2, text: 'Alice Smith completed Video Bot Interview', time: '1h ago', read: true }
  ]);

  return (
    <AppContext.Provider value={{
      jobs, setJobs,
      candidates, setCandidates,
      notifications, setNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
};
