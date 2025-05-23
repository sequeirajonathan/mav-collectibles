import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { createBrowserClient } from '@supabase/ssr';

const isServer = typeof window === 'undefined';

// Extend the InternalAxiosRequestConfig type to include our custom metadata
interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    resolveRequest?: (value: unknown) => void;
  };
}

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

const axiosClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || (isServer ? 'http://localhost:3000' : '')}/api/v1`,
  withCredentials: true,
  headers: {
    'Cache-Control': 'public, max-age=300',
    Pragma: 'no-cache',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request deduplication cache with timestamps
const pendingRequests = new Map<string, PendingRequest>();
const DEDUPLICATION_WINDOW = 100; // 100ms window for deduplication

// Add request deduplication
axiosClient.interceptors.request.use((config: CustomInternalAxiosRequestConfig) => {
  const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;
  const now = Date.now();
  
  // Check if there's a pending request within the deduplication window
  const existingRequest = pendingRequests.get(requestKey);
  if (existingRequest && (now - existingRequest.timestamp) < DEDUPLICATION_WINDOW) {
    // Return the existing promise instead of rejecting
    return existingRequest.promise as Promise<CustomInternalAxiosRequestConfig>;
  }

  const requestPromise = new Promise((resolve) => {
    config.metadata = { ...config.metadata, resolveRequest: resolve };
  });
  
  // Store the request with its timestamp
  pendingRequests.set(requestKey, {
    promise: requestPromise,
    timestamp: now
  });
  
  return config;
});

// Clear request from cache after completion
axiosClient.interceptors.response.use(
  (response) => {
    const requestKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params || {})}`;
    pendingRequests.delete(requestKey);
    return response;
  },
  (error: AxiosError) => {
    if (error.config) {
      const requestKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.params || {})}`;
      pendingRequests.delete(requestKey);
    }
    return Promise.reject(error);
  }
);

// Debug: Log all requests and responses
if (process.env.NEXT_PUBLIC_DEBUG) {
  axiosClient.interceptors.request.use((config) => {
    console.log('[AXIOS REQUEST]', config.method, `${config.baseURL || ''}${config.url || ''}`, config);
    return config;
  });

  axiosClient.interceptors.response.use(
    (response) => {
      console.log('[AXIOS RESPONSE]', response.config.url, response);
      return response;
    },
    (error) => {
      if (error.config) {
        console.error('[AXIOS ERROR]', error.config.url, error);
      } else {
        console.error('[AXIOS ERROR]', error);
      }
      return Promise.reject(error);
    }
  );
}

if (!isServer) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Add token to request
  axiosClient.interceptors.request.use(async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  // Handle response errors + retry on 401
  axiosClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (
        error.response?.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          const token = data.session?.access_token;

          if (refreshError || !token) {
            console.warn('[Axios] Token refresh failed', refreshError);
            return Promise.reject(error);
          }

          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };

          return axiosClient(originalRequest);
        } catch (refreshErr) {
          console.error('[Axios] Retry after token refresh failed:', refreshErr);
          return Promise.reject(error);
        }
      }

      return Promise.reject({
        message: (error.response?.data as { message?: string })?.message || error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  );
}

export { axiosClient };
