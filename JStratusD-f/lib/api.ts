import axios from 'axios';

const API_BASE_URL = 'https://godn-gw.duckdns.org/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. REQUEST INTERCEPTOR ---
// Automatically adds the Token to requests starting with '/jsd'
api.interceptors.request.use(
  (config) => {
    // Only attach tokens for specific endpoints (like your old code did)
    // You can remove "&& config.url.startsWith('/jsd')" if you want it on ALL requests.
    if (config.url && config.url.startsWith('/jsd')) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('jstratusd-token');
        const userId = localStorage.getItem('jstratusd-userId');

        // Check that token is valid (not null, not "undefined" string)
        if (token && token !== 'undefined') {
          // Remove quotes if they exist in the stored string (common issue with JSON.stringify)
          const cleanToken = token.replace(/"/g, '').trim();
          config.headers.Authorization = `Bearer ${cleanToken}`;
        }
        
        // Optional: Attach User ID if needed
        if (userId && userId !== 'undefined') {
          config.headers['X-User-Id'] = userId;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 2. RESPONSE INTERCEPTOR ---
// Handles 401 (Unauthorized) errors globally to auto-logout users
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      
      // Check if this request was a Login attempt (we don't want to logout on a wrong password)
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      // FORCE LOGOUT condition:
      // 1. Status is 401 (Unauthorized)
      // 2. It was NOT a login attempt (e.g., token expired on dashboard)
      if (status === 401 && !isLoginRequest) {
        if (typeof window !== 'undefined') {
          console.warn("Session expired or invalid token. Logging out...");
          
          localStorage.removeItem('jstratusd-token');
          localStorage.removeItem('jstratusd-userId');

          // Hard redirect to login to clear application state
          if (window.location.pathname !== '/login') {
             window.location.href = '/login';
          }
        }
      }
    }
    // Always pass the error back so the calling component (Page) can show a Toast message
    return Promise.reject(error);
  }
);

export default api;