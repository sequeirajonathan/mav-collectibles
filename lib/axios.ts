import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
});

// Client-side API client (uses anon key)
export const publicClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
});

// Server-side API client (uses service role key)
export const serverClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
});

// Add auth token to requests when user is logged in (client-side)
export const setAuthToken = (token: string | null) => {
  if (token) {
    publicClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete publicClient.defaults.headers.common['Authorization'];
  }
};

// Request interceptor for adding auth token, etc.
publicClient.interceptors.request.use(
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
publicClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors gracefully, especially during SSR
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);

// Request interceptor for adding auth token, etc.
serverClient.interceptors.request.use(
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
serverClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors gracefully, especially during SSR
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);

export default supabaseApi; 