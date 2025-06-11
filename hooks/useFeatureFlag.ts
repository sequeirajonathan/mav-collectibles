import { useResource } from '@lib/swr';
import { FeatureFlag } from '@interfaces';
import { axiosClient } from '@lib/axios';

type FeatureFlagApiResponse = { data: FeatureFlag[] };

export function useFeatureFlags() {
  const resource = useResource<FeatureFlagApiResponse>('/feature-flags', {
    onError: (error) => {
      console.error('Failed to fetch feature flags:', error);
    },
    fallbackData: { data: [] }
  });

  // Return the array directly
  return {
    ...resource,
    data: resource.data?.data ?? []
  };
}

export function useUpdateFeatureFlag() {
  const { update, refresh } = useResource<FeatureFlag>('/feature-flags');

  return {
    mutate: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      try {
        const result = await update(id, { enabled });
        await refresh();
        return result;
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
