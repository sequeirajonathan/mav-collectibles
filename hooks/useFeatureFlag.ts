import { useResource } from '@lib/swr';
import { FeatureFlag } from '@interfaces';
import { axiosClient } from '@lib/axios';
import { toast } from 'react-hot-toast';

export function useFeatureFlags() {
  const { data, error, isLoading, refresh } = useResource<FeatureFlag[]>('feature-flags', {
    onError: (error) => {
      console.error('Failed to fetch feature flags:', error);
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('No feature flags found');
        } else if (error.status === 500) {
          toast.error('Server error while loading feature flags');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading feature flags');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else {
          toast.error(error.message || 'Failed to load feature flags');
        }
      } else {
        toast.error('Failed to load feature flags');
      }
    },
    fallbackData: []
  });

  return {
    data: Array.isArray(data) ? data : [],
    error,
    isLoading,
    refresh
  };
}

export function useUpdateFeatureFlag() {
  const { refresh } = useResource<FeatureFlag[]>('feature-flags');

  return {
    mutate: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      try {
        await axiosClient.patch(`feature-flags/${id}`, { enabled });
        await refresh();
        toast.success('Feature flag updated successfully');
        return true;
      } catch (error) {
        console.error('Failed to update feature flag:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to update feature flag');
        } else {
          toast.error('Failed to update feature flag');
        }
        throw error;
      }
    }
  };
}

export function useSeedFeatureFlags() {
  const { refresh } = useResource<FeatureFlag[]>('feature-flags');

  return {
    mutate: async () => {
      try {
        await axiosClient.post('feature-flags/seed');
        await refresh();
        toast.success('Feature flags seeded successfully');
      } catch (error) {
        console.error('Failed to seed feature flags:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to seed feature flags');
        } else {
          toast.error('Failed to seed feature flags');
        }
        throw error;
      }
    }
  };
}
