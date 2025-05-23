"use client";

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AlertBanner } from '@interfaces';
import queryClient from '@lib/queryClient';
import { fetchFeaturedEvents } from '@services/featuredEventService';
import { getGoogleReviews } from '@services/googleReviewsService';
import { fetchAlertBanner } from '@services/alertBannerService';

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
  useEffect(() => {
    // Prefetch critical data
    const prefetchData = async () => {
      try {
        // Prefetch featured events
        await queryClient.prefetchQuery({
          queryKey: ['featuredEvents'],
          queryFn: fetchFeaturedEvents,
          staleTime: 5 * 60 * 1000, // 5 minutes
        });

        // Prefetch Google reviews
        await queryClient.prefetchQuery({
          queryKey: ['googleReviews'],
          queryFn: getGoogleReviews,
          staleTime: 5 * 60 * 1000, // 5 minutes
        });

        // Prefetch alert banner
        await queryClient.prefetchQuery({
          queryKey: ['alertBanner'],
          queryFn: fetchAlertBanner,
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      } catch (error) {
        console.error('Error prefetching data:', error);
      }
    };

    prefetchData();
  }, []);

  return <>{children}</>;
} 