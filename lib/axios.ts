import axios from 'axios';

// Create an Axios instance with default config
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token, etc.
axiosClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Handle unauthorized (e.g., redirect to login)
        console.error('Unauthorized access');
      }
      
      // Handle 404 Not Found
      if (error.response.status === 404) {
        console.error('Resource not found');
      }
      
      // Handle 500 Server Error
      if (error.response.status >= 500) {
        console.error('Server error');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient; 