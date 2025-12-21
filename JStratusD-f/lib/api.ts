import axios from 'axios';

const API_BASE_URL = 'https://godn-gw.duckdns.org/';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('/jsd')) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('jstratusd-token');
        const userId = localStorage.getItem('jstratusd-userId');

        // FIX: Check that token is not null AND not the string "undefined"
        if (token && token !== 'undefined') {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // FIX: Same check for userId
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

export default api;