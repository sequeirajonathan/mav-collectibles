import { useResource } from '@lib/swr';
import { FeaturedEvent } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useFeaturedEvents() {
  return useResource<FeaturedEvent[]>('/featured-events', {
    onError: (error) => {
      console.error('Failed to fetch featured events:', error);
      toast.error('Failed to load featured events');
    }
  });
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
        toast.error('Failed to create event');
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
        toast.error('Failed to update event');
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
        toast.error('Failed to delete event');
        throw error;
      }
    }
  };
}
