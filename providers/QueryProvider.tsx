"use client";

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AlertBanner } from '@interfaces';
import queryClient from '@lib/queryClient';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

interface QueryProviderProps {
  children: React.ReactNode;
  initialAlertBanner?: AlertBanner | null;
}

export function QueryProvider({ children, initialAlertBanner }: QueryProviderProps) {
  // Set initial data for alert banner if provided
  if (initialAlertBanner !== undefined) {
    queryClient.setQueryData(['alertBanner'], initialAlertBanner);
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localStoragePersister = createSyncStoragePersister({ storage: window.localStorage });
      persistQueryClient({
        queryClient,
        persister: localStoragePersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }
  }, []);

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