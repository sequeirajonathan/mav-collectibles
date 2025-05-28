import { axiosClient } from '@lib/axios';
import { AlertBanner } from '@validations/alert-banner';
import { prisma } from '@lib/prisma';
import { alertBannerSchema } from '@validations/alert-banner';

// Fetch the active alert banner
export async function fetchAlertBanner(): Promise<AlertBanner | null> {
  // If we're on the server, use Prisma directly
  if (typeof window === 'undefined') {
    try {
      const alertBanner = await prisma.alertBanner.findFirst({
        where: { enabled: true },
      });
      
      if (!alertBanner) return null;
      
      // Add id field to the data
      const bannerWithId = {
        ...alertBanner,
        id: alertBanner.id.toString()
      };
      
      // Validate the data before returning
      return alertBannerSchema.parse(bannerWithId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching alert banner from database:', error, error.message, error.stack);
      } else {
        console.error('Error fetching alert banner from database:', error);
      }
      return null;
    }
  }

  // If we're on the client, use axios
  try {
    const { data } = await axiosClient.get('/alert-banner');
    
    // Check if data exists and has an id
    if (!data || !data.id) {
      console.warn('No alert banner data received from API');
      return null;
    }

    // Add id field to the data
    const bannerWithId = {
      ...data,
      id: data.id.toString()
    };

    // Validate the response data
    return alertBannerSchema.parse(bannerWithId);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching alert banner from API:', error, error.message, error.stack);
    } else {
      console.error('Error fetching alert banner from API:', error);
    }
    return null;
  }
}

// Update existing alert banner
export async function updateAlertBanner(id: string, bannerData: Partial<AlertBanner>): Promise<AlertBanner> {
  if (!id) {
    throw new Error('Alert banner ID is required for update');
  }

  // Validate the data before sending
  const validatedData = alertBannerSchema.partial().parse(bannerData);
  const { data } = await axiosClient.patch(`/alert-banner/${id}`, validatedData);
  
  // Check if data exists and has an id
  if (!data || !data.id) {
    throw new Error('Invalid response from alert banner update');
  }

  // Validate the response
  return alertBannerSchema.parse(data);
}

// Create a new alert banner if one doesn't exist
export async function createAlertBanner(bannerData: Partial<AlertBanner>): Promise<AlertBanner> {
  // Validate the data before sending
  const validatedData = alertBannerSchema.parse(bannerData);
  const { data } = await axiosClient.post('/alert-banner', validatedData);
  
  // Check if data exists and has an id
  if (!data || !data.id) {
    throw new Error('Invalid response from alert banner creation');
  }

  // Validate the response
  return alertBannerSchema.parse(data);
}
