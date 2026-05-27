import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobPostings from './pages/JobPostings';
import ResumeUpload from './pages/ResumeUpload';
import CandidateForms from './pages/CandidateForms';
import VideoBot from './pages/VideoBot';
import TechnicalScheduler from './pages/TechnicalScheduler';
import Reports from './pages/Reports';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<JobPostings />} />
            <Route path="/resumes" element={<ResumeUpload />} />
            <Route path="/forms" element={<CandidateForms />} />
            <Route path="/video-bot" element={<VideoBot />} />
            <Route path="/scheduler" element={<TechnicalScheduler />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
