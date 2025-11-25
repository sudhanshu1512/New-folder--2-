// components/PublicRoute.jsx
import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const alertedRef = useRef(false);

  useEffect(() => {
    if (loading) return;               // still checking auth -> do nothing
    if (!currentUser) return;          // guest -> do nothing
    if (location.pathname === '/login') return; // important: don't alert during login flow

    // show the alert only once
    if (!alertedRef.current) {
      alertedRef.current = true;
      // you can replace this with a toast library call
    }
  }, [currentUser, loading, location.pathname]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (currentUser) {
    return <Navigate to="/flight-search" replace />;
  }

  return children;
}
