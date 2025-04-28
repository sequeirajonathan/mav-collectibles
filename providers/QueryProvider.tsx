"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrefetchProducts } from '@hooks/useSquareProducts';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PrefetchManager>
        {children}
      </PrefetchManager>
    </QueryClientProvider>
  );
}

// Component to manage prefetching
function PrefetchManager({ children }: { children: React.ReactNode }) {
  usePrefetchProducts();
  return <>{children}</>;
} 