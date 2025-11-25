import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { handleLogout, refreshAuthToken, setupInactivityTimer } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Store the cleanup function from setupInactivityTimer
  const inactivityCleanupRef = useRef(null);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clean up the inactivity timer
      if (inactivityCleanupRef.current) {
        inactivityCleanupRef.current();
        inactivityCleanupRef.current = null;
      }
      
      handleLogout();
      setCurrentUser(null);
      setLoading(false);
    }
  }, []);

  // Use a ref to track the auth check state
  const authCheckInProgress = useRef(false);
  const initialCheckDone = useRef(false);

  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) return;
    
    const token = localStorage.getItem('token');
  
    if (!token) {
      setLoading(false);
      initialCheckDone.current = true;
      return;
    }

    // If we already have a user and did an initial check, don't check again
    if (initialCheckDone.current && currentUser) {
      return;
    }

    try {
      authCheckInProgress.current = true;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/auth/me');
      
      if (response.data?.user) {
        setCurrentUser(response.data.user);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogout();
    } finally {
      setLoading(false);
      authCheckInProgress.current = false;
      initialCheckDone.current = true;
    }
  }, [currentUser]);

  // Setup and cleanup inactivity timer based on auth state
  useEffect(() => {
    if (currentUser) {
      // Set up inactivity timer when user is logged in
      inactivityCleanupRef.current = setupInactivityTimer();
      
      // Clean up on unmount or when user logs out
      return () => {
        if (inactivityCleanupRef.current) {
          inactivityCleanupRef.current();
          inactivityCleanupRef.current = null;
        }
      };
    }
  }, [currentUser]);

  useEffect(() => {
    // Only check auth if we haven't already done so
    if (!authCheckInProgress.current && !initialCheckDone.current) {
      checkAuth();
    }
  }, [checkAuth]);

  // Only run the auth check once on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (mobile, password) => {
    try {
      
      const response = await api.post('/auth/login', { Userid: mobile, password },{ _skipInterceptor: true });
      
      if (response.data.token) {
        // Store the token
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Set the token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Update user state
        setCurrentUser(response.data.user);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.data?.message || 'Login failed' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    } finally {
    
    }
  };

  const agentRegister = async (formData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/agent-register', formData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Set the token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Update user state
        setCurrentUser(response.data.user);
        return { success: true, message: response.data.message };
      }
      
      return { 
        success: false, 
        error: response.data?.message || 'Agent registration failed' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Agent registration failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', { email });
      return { 
        success: true, 
        message: response.data?.message || 'Password reset email sent' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to process forgot password request' 
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    agentRegister,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};