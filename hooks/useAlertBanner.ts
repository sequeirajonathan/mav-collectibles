import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAlertBanner, updateAlertBanner, createAlertBanner } from '@services/alertBannerService';
import { AlertBanner } from '@interfaces';

export function useAlertBanner() {
  return useQuery<AlertBanner | null>({
    queryKey: ['alertBanner'],
    queryFn: fetchAlertBanner,
  });
}

export function useUpdateAlertBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertBanner> }) => updateAlertBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertBanner'] });
    },
  });
}

export function useCreateAlertBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<AlertBanner>) => createAlertBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertBanner'] });
    },
  });
}
