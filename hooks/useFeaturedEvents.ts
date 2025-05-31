import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFeaturedEvents, createFeaturedEvent, updateFeaturedEvent, deleteFeaturedEvent } from '@services/featuredEventService';
import { FeaturedEvent } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useFeaturedEvents() {
  return useQuery<FeaturedEvent[], Error>({
    queryKey: ['featuredEvents'],
    queryFn: fetchFeaturedEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (v5 uses gcTime instead of cacheTime)
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
}

export function useCreateFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => createFeaturedEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredEvents'] });
      toast.success('Event created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  });
}

export function useUpdateFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeaturedEvent> }) => updateFeaturedEvent(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['featuredEvents'] });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData<FeaturedEvent[]>(['featuredEvents']);

      // Optimistically update to the new value
      if (previousEvents) {
        queryClient.setQueryData<FeaturedEvent[]>(['featuredEvents'], old =>
          old?.map(event => event.id === id ? { ...event, ...data } : event)
        );
      }

      return { previousEvents };
    },
    onError: (err: Error, newEvent, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvents) {
        queryClient.setQueryData(['featuredEvents'], context.previousEvents);
      }
      console.error('Error updating event:', err);
      toast.error('Failed to update event');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredEvents'] });
      toast.success('Event updated successfully');
    }
  });
}

export function useDeleteFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFeaturedEvent(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['featuredEvents'] });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData<FeaturedEvent[]>(['featuredEvents']);

      // Optimistically update to the new value
      if (previousEvents) {
        queryClient.setQueryData<FeaturedEvent[]>(['featuredEvents'], old =>
          old?.filter(event => event.id !== id)
        );
      }

      return { previousEvents };
    },
    onError: (err: Error, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvents) {
        queryClient.setQueryData(['featuredEvents'], context.previousEvents);
      }
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredEvents'] });
      toast.success('Event deleted successfully');
    }
  });
}
