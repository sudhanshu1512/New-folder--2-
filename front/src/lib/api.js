import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000, // Increased from 10s to 15s
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Token management functions (Your existing code is perfect) ---
const getToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setToken = (token) => {
  localStorage.setItem('token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};
const setRefreshToken = (token) => localStorage.setItem('refreshToken', token);

// Function to fetch airline suggestions
export const fetchAirlineSuggestions = async (query) => {
  try {
    const response = await api.get(`/airlines/suggest?q=${encodeURIComponent(query)}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching airline suggestions:', error);
    return [];
  }
};

//function to fetch supplier in suggestions
export const fetchSupplierSuggestions = async () => {
  try {
    const response = await api.get(`/inventory/supplier/suggest`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching supplier suggestions:', error);
    return [];
  }
};

// Debounced version of fetchAirlineSuggestions
const debounce = (func, delay) => {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

export const createAirlineSuggestionHandler = (setAirlineSuggestions, setIsLoadingAirlines, setShowAirlineSuggestions) => {
  const fetchAirlineSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setAirlineSuggestions([]);
      return;
    }

    try {
      setIsLoadingAirlines(true);
      const response = await api.get(`/airlines/suggest?q=${encodeURIComponent(query)}`);
      setAirlineSuggestions(response.data || []);
      setShowAirlineSuggestions(true);
    } catch (error) {
      console.error('Error fetching airline suggestions:', error);
      setAirlineSuggestions([]);
    } finally {
      setIsLoadingAirlines(false);
    }
  };

  return {
    fetchAirlineSuggestions: debounce(fetchAirlineSuggestions, 300),
    clearAirlineSuggestions: () => {
      setAirlineSuggestions([]);
      setShowAirlineSuggestions(false);
    }
  };
};

export const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  delete api.defaults.headers.common['Authorization'];
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Inactivity timer setup
export const setupInactivityTimer = () => {
  let inactivityTimer;
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    // Set a new timeout
    inactivityTimer = setTimeout(() => {
      if (getToken()) {  // Only log out if user is actually logged in
        handleLogout();
        alert('You have been logged out due to inactivity.');
      }
    }, INACTIVITY_TIMEOUT);
  };

  // Set up event listeners
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  events.forEach(event => {
    window.addEventListener(event, resetTimer);
  });

  // Initial timer setup
  resetTimer();

  // Cleanup function
  return () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    events.forEach(event => {
      window.removeEventListener(event, resetTimer);
    });
  };
};

export const refreshAuthToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    
    const response = await api.post('/auth/refresh', { refreshToken });
    const { token, refreshToken: newRefreshToken } = response.data;
    
    setToken(token);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }
    return token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    handleLogout();
    throw error;
  }
};


// --- MODIFIED REQUEST INTERCEPTOR (PROACTIVE REFRESH) ---
api.interceptors.request.use(
  async (config) => {
    // Do not attach token to auth-related routes
    if (config.url?.includes('/auth/login') || 
        config.url?.includes('/auth/agent-register') || 
        config.url?.includes('/auth/signup') ||
        config.url?.includes('/auth/forgot-password')) {
      return config;
    }

    let token = getToken();

    if (token) {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Check if token is expired or about to expire (e.g., within 60 seconds)
      if (decodedToken.exp < currentTime + 60) {
        try {
          console.log('Token is expired or about to expire, refreshing...');
          token = await refreshAuthToken(); // Refresh the token
        } catch (error) {
          console.error('Could not refresh token.', error);
          return Promise.reject(error);
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// --- RESPONSE INTERCEPTOR (FALLBACK) ---
// This remains useful as a fallback in case a token expires between the check and the request.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Do NOT try to refresh token for auth-related routes
    if (originalRequest.url?.includes('/auth/login') || 
        originalRequest.url?.includes('/auth/agent-register') || 
        originalRequest.url?.includes('/auth/signup') ||
        originalRequest.url?.includes('/auth/forgot-password')) {
      return Promise.reject(error);
    }
    
    // Check for 401 error and ensure it's not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // handleLogout is called inside refreshAuthToken on failure
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;