"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext<any>(null);

export const useAppContext = () => useContext(AppContext);

const API_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
const API_SECRET = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || process.env.INTERNAL_API_SECRET;

/** Authenticated fetch — automatically attaches the internal API secret header */
export const apiFetch = (path, options = {}) => {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_SECRET,
      ...(options.headers || {}),
    },
  });
};

export const AppProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchJobs = async () => {
    try {
      const res = await apiFetch('/api/jobs');
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
      const res = await apiFetch('/api/candidates');
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
      refreshCandidates: fetchCandidates,
      apiFetch,
    }}>
      {children}
    </AppContext.Provider>
  );
};

