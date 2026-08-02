import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export function AdminGuard() {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Let the parent ProtectedRoute handle loading Screen
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  
  return <Outlet />;
}
