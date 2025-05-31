import { axiosClient } from '@lib/axios';
import { FeaturedEvent } from '@interfaces';

// Helper function to convert Prisma event to FeaturedEvent interface
const convertPrismaEventToFeaturedEvent = (event: any): FeaturedEvent => ({
  ...event,
  date: event.date.toISOString(),
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString()
});

// Fetch all featured events
export async function fetchFeaturedEvents(): Promise<FeaturedEvent[]> {
  try {
    const { data } = await axiosClient.get('/featured-events');
    return data;
  } catch (error) {
    console.error('Error fetching featured events:', error);
    throw new Error('Failed to fetch featured events');
  }
}

// Create a new featured event
export async function createFeaturedEvent(eventData: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedEvent> {
  try {
    const { data } = await axiosClient.post('/featured-events', eventData);
    return data;
  } catch (error) {
    console.error('Error creating featured event:', error);
    throw new Error('Failed to create featured event');
  }
}

// Update an existing featured event
export async function updateFeaturedEvent(id: string, eventData: Partial<FeaturedEvent>): Promise<FeaturedEvent> {
  try {
    const { data } = await axiosClient.patch(`/featured-events/${id}`, eventData);
    return data;
  } catch (error) {
    console.error('Error updating featured event:', error);
    throw new Error('Failed to update featured event');
  }
}

// Delete a featured event
export async function deleteFeaturedEvent(id: string): Promise<void> {
  try {
    await axiosClient.delete(`/featured-events/${id}`);
  } catch (error) {
    console.error('Error deleting featured event:', error);
    throw new Error('Failed to delete featured event');
  }
}
