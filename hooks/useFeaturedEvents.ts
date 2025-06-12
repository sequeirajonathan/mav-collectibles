import { useResource } from '@lib/swr';
import { FeaturedEvent } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useFeaturedEvents() {
  const result = useResource<FeaturedEvent[]>('/featured-events', {
    onError: (error) => {
      console.error('Featured events error:', error);
      
      // Enhanced error handling with more specific cases
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('No featured events found');
        } else if (error.status === 500) {
          toast.error('Server error while loading featured events');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading featured events');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else if (error.code === 'UNKNOWN_ERROR') {
          toast.error('An unexpected error occurred. Please try again later.');
        } else {
          toast.error(error.message || 'Failed to load featured events. Please try again later.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again later.');
      }
    },
    fallbackData: [],
    retryCount: 3,
    retryInterval: 5000,
    timeout: 10000
  });

  return result;
}

export function useCreateFeaturedEvent() {
  const { create, refresh } = useResource<FeaturedEvent>('/featured-events');

  return {
    mutate: async (eventData: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const result = await create(eventData);
        await refresh();
        toast.success('Event created successfully');
        return result;
      } catch (error) {
        console.error('Error creating event:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to create event');
        } else {
          toast.error('Failed to create event');
        }
        throw error;
      }
    }
  };
}

export function useUpdateFeaturedEvent() {
  const { update, refresh } = useResource<FeaturedEvent>('/featured-events');

  return {
    mutate: async ({ id, data }: { id: string; data: Partial<FeaturedEvent> }) => {
      try {
        const result = await update(id, data);
        await refresh();
        toast.success('Event updated successfully');
        return result;
      } catch (error) {
        console.error('Error updating event:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to update event');
        } else {
          toast.error('Failed to update event');
        }
        throw error;
      }
    }
  };
}

export function useDeleteFeaturedEvent() {
  const { remove, refresh } = useResource<FeaturedEvent>('/featured-events');

  return {
    mutate: async (id: string) => {
      try {
        await remove(id);
        await refresh();
        toast.success('Event deleted successfully');
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to delete event');
        } else {
          toast.error('Failed to delete event');
        }
        throw error;
      }
    }
  };
}
