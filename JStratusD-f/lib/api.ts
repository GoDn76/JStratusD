import axios from 'axios';

// 1. Create the Axios instance
const api = axios.create({
  baseURL: 'https://godn-gw.duckdns.org/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Add the Response Interceptor
api.interceptors.response.use(
  // A. Success Handler: Pass the response through
  (response) => response,
  
  // B. Error Handler: Check for 401s
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // C. CATCH-ALL: If status is 401, force logout
      if (status === 401) {
        
        // Only run on client-side
        if (typeof window !== 'undefined') {
          console.warn("Unauthorized (401). Logging out...");

          // 1. Clear all auth data
          localStorage.removeItem('jstratusd-token');
          localStorage.removeItem('jstratusd-userId');

          // 2. Hard redirect to login (prevents loop if already there)
          if (window.location.pathname !== '/login') {
             window.location.href = '/login';
          }
        }
      }
    }

    // Always reject so the UI knows the request failed
    return Promise.reject(error);
  }
);

export default api;