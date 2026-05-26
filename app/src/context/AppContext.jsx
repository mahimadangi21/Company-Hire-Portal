import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

const API_URL = 'http://localhost:3000';

export const AppProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New resume uploaded for Frontend Engineer', time: '5m ago', read: false },
    { id: 2, text: 'Alice Smith completed Video Bot Interview', time: '1h ago', read: true }
  ]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error("Error fetching jobs:", e);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/candidates`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.map(c => ({
          ...c,
          // Map snake_case from DB to camelCase expected by existing React UI
          jobApplied: c.job_applied,
          resumeStatus: c.resume_status,
          formStatus: c.form_status,
          videoStatus: c.video_status,
          techStatus: c.tech_status,
          reportStatus: c.report_status,
          resumeScore: c.resume_score,
          videoScore: c.video_score,
          techScore: c.tech_score,
          finalRecommendation: c.final_recommendation,
          extractedData: c.extracted_data
        })));
      }
    } catch (e) {
      console.error("Error fetching candidates:", e);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCandidates();
  }, []);

  return (
    <AppContext.Provider value={{
      jobs, setJobs,
      candidates, setCandidates,
      notifications, setNotifications,
      refreshJobs: fetchJobs,
      refreshCandidates: fetchCandidates
    }}>
      {children}
    </AppContext.Provider>
  );
};
