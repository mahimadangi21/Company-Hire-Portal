import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobPostings from './pages/JobPostings';
import ResumeUpload from './pages/ResumeUpload';
import VideoBot from './pages/VideoBot';
import TechnicalScheduler from './pages/TechnicalScheduler';
import Reports from './pages/Reports';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route — login only */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes — require admin session */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<JobPostings />} />
            <Route path="/resumes" element={<ResumeUpload />} />
            <Route path="/video-bot" element={<VideoBot />} />
            <Route path="/scheduler" element={<TechnicalScheduler />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Catch-all: redirect to home (ProtectedRoute will handle auth check) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
