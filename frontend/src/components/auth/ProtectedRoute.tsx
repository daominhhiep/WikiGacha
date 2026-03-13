import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Higher-order component to protect routes that require authentication.
 * Redirects to home page if the user is not logged in.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { player, accessToken } = useAuthStore();
  const location = useLocation();

  if (!player || !accessToken) {
    // Redirect them to the home page, but save the current location they were
    // trying to go to when they were redirected.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
