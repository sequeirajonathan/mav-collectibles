import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { fetchFeatureFlags, updateFeatureFlag, seedFeatureFlags } from '@services/featureFlagService';
import { FeatureFlag } from '@interfaces';

export function useFeatureFlags() {
  return useQuery<FeatureFlag[]>({
    queryKey: ['featureFlags'],
    queryFn: fetchFeatureFlags,
  });
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateFeatureFlag(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
    }
  });
}

export function useSeedFeatureFlags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seedFeatureFlags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
    }
  });
}
