import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFeaturedEvents, createFeaturedEvent, updateFeaturedEvent, deleteFeaturedEvent } from '@services/featuredEventService';
import { FeaturedEvent } from '@interfaces';

export function useFeaturedEvents() {
  return useQuery<FeaturedEvent[]>({
    queryKey: ['featuredEvents'],
    queryFn: fetchFeaturedEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (v5 uses gcTime instead of cacheTime)
    refetchOnWindowFocus: false, // less network usage
  });
}

export function useCreateFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => createFeaturedEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredEvents'] });
    },
  });
}

export function useUpdateFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeaturedEvent> }) => updateFeaturedEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredEvents'] });
    },
  });
}

export function useDeleteFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFeaturedEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredEvents'] });
    },
  });
}
