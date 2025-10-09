// Create a new file: components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;