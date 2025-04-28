import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '', // fallback if needed
  withCredentials: true, // important if you handle auth sessions/cookies
  headers: {
    'Cache-Control': 'public, max-age=300', // 5 minutes
    'Pragma': 'no-cache',
  },
});