import { axiosClient } from '@lib/axios';
import { FeaturedEvent } from '@interfaces';

// Fetch all featured events
export async function fetchFeaturedEvents(): Promise<FeaturedEvent[]> {
  const { data } = await axiosClient.get('/featured-events');
  return data;
}

// Create a new featured event
export async function createFeaturedEvent(eventData: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedEvent> {
  const { data } = await axiosClient.post('/featured-events', eventData);
  return data;
}

// Update an existing featured event
export async function updateFeaturedEvent(id: string, eventData: Partial<FeaturedEvent>): Promise<FeaturedEvent> {
  const { data } = await axiosClient.patch(`/featured-events/${id}`, eventData);
  return data;
}

// Delete a featured event
export async function deleteFeaturedEvent(id: string): Promise<void> {
  await axiosClient.delete(`/featured-events/${id}`);
}
