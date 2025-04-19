/**
 * Configuration for API URLs based on environment
 */
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  
  // Server-side rendering should use the deployment URL or localhost
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return 'http://localhost:3000';
};

export const config = {
  baseUrl: getBaseUrl(),
}; 