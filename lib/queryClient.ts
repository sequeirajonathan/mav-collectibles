import { QueryClient } from '@tanstack/react-query';

// Create a singleton instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours for persistence
    },
  },
});

export default queryClient; 