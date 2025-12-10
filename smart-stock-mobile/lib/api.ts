import axios from 'axios';

// TODO: Update this IP to your local machine's IP address
// Find your IP: Windows (ipconfig) | Mac/Linux (ifconfig or ip addr)
// Make sure your phone is on the same WiFi network as your dev machine
const API_BASE_URL = 'http://192.168.1.200:5001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for AI generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - is the server running?');
    } else if (!error.response) {
      console.error(
        'Network error - check if server is running at:',
        API_BASE_URL
      );
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
