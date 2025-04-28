import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAlertBanner, updateAlertBanner, createAlertBanner } from '@services/alertBannerService';
import { AlertBanner } from '@interfaces';

export function useAlertBanner() {
  return useQuery<AlertBanner | null>({
    queryKey: ['alertBanner'],
    queryFn: fetchAlertBanner,
    // Keep data fresh for 24 hours unless explicitly invalidated
    staleTime: 1000 * 60 * 60 * 24,
    // Cache the data for 24 hours
    gcTime: 1000 * 60 * 60 * 24,
    // Don't refetch on window focus since alert banner changes are rare
    refetchOnWindowFocus: false,
    // Don't refetch on mount since we have SSR data
    refetchOnMount: false,
    initialData: null,
  });
}

export function useUpdateAlertBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertBanner> }) => updateAlertBanner(id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['alertBanner'] });
      const previousBanner = queryClient.getQueryData(['alertBanner']);

      // Optimistically update to the new value
      queryClient.setQueryData(['alertBanner'], (old: AlertBanner | null) => {
        if (!old) return null;
        return { ...old, ...newData.data };
      });

      return { previousBanner };
    },
    onError: (err, newData, context) => {
      if (context?.previousBanner) {
        queryClient.setQueryData(['alertBanner'], context.previousBanner);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: ['alertBanner'] });
    },
  });
}

export function useCreateAlertBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<AlertBanner>) => createAlertBanner(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['alertBanner'] });
      const previousBanner = queryClient.getQueryData(['alertBanner']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['alertBanner'], newData as AlertBanner);
      
      return { previousBanner };
    },
    onError: (err, newData, context) => {
      if (context?.previousBanner) {
        queryClient.setQueryData(['alertBanner'], context.previousBanner);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['alertBanner'] });
    },
  });
}
