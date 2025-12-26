import axios from 'axios';

// 1. Create the Axios instance
const api = axios.create({
  baseURL: 'https://godn-gw.duckdns.org/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Add the Response Interceptor
// This runs automatically after every response comes back from the server
api.interceptors.response.use(
  // If the request succeeds, just return the response
  (response) => response,
  
  // If the request fails (throws an error)
  (error) => {
    // Check if we have a response from the server
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // SPECIFIC CHECK: 401 Unauthorized
      // We check for status 401 OR the specific error message you mentioned
      if (status === 401 || errorData?.error === "Invalid Access Token") {
        
        // Only run this logic in the browser (client-side)
        if (typeof window !== 'undefined') {
          console.warn("Session expired. Logging out...");

          // A. Remove the invalid tokens
          localStorage.removeItem('jstratusd-token');
          localStorage.removeItem('jstratusd-userId');

          // B. Force redirect to login page
          // We use window.location.href instead of router.push to ensure 
          // the app state is completely cleared/refreshed.
          if (window.location.pathname !== '/login') {
             window.location.href = '/login';
          }
        }
      }
    }

    // Always reject the promise so the specific component 
    // knows something went wrong (e.g., to stop a loading spinner)
    return Promise.reject(error);
  }
);

export default api;