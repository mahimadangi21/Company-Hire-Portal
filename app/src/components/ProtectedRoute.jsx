import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Guards protected routes — redirects to /login if no valid session exists.
 * Session is stored in sessionStorage so it clears automatically when the browser closes.
 */
const ProtectedRoute = ({ children }) => {
  const session = sessionStorage.getItem('kl_admin_session');

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
