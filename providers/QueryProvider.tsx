"use client";

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AlertBanner } from '@interfaces';
import queryClient from '@lib/queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
  initialAlertBanner?: AlertBanner | null;
}

export function QueryProvider({ children, initialAlertBanner }: QueryProviderProps) {
  // Set initial data for alert banner if provided
  if (initialAlertBanner !== undefined) {
    queryClient.setQueryData(['alertBanner'], initialAlertBanner);
  }

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
  return <>{children}</>;
} 