import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated Peaceful Spinner */}
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-primary-500 animate-spin"></div>
          <p className="text-slate-400 dark:text-slate-500 font-medium text-sm tracking-wide">
            Loading your peaceful space...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
