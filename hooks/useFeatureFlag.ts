import { useResource } from '@lib/swr';
import { FeatureFlag } from '@interfaces';
import { axiosClient } from '@lib/axios';

export function useFeatureFlags() {
  return useResource<FeatureFlag[]>('/feature-flags', {
    onError: (error) => {
      console.error('Failed to fetch feature flags:', error);
    },
    fallbackData: []
  });
}

export function useUpdateFeatureFlag() {
  const { refresh } = useResource<FeatureFlag[]>('/feature-flags');

  return {
    mutate: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      try {
        await axiosClient.patch(`/feature-flags/${id}`, { enabled });
        await refresh();
        return true;
      } catch (error) {
        console.error('Failed to update feature flag:', error);
        throw error;
      }
    }
  };
}

export function useSeedFeatureFlags() {
  const { refresh } = useResource<FeatureFlag[]>('/feature-flags');

  return {
    mutate: async () => {
      try {
        await axiosClient.post('/feature-flags/seed');
        await refresh();
      } catch (error) {
        console.error('Failed to seed feature flags:', error);
        throw error;
      }
    }
  };
}
