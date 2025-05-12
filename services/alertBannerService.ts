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
    } catch (error) {
      console.error('Error fetching alert banner from database:', error);
      return null;
    }
  }

  // If we're on the client, use axios
  try {
    const { data } = await axiosClient.get('/alert-banner');
    // Add id field to the data
    const bannerWithId = {
      ...data,
      id: data.id.toString()
    };
    // Validate the response data
    return alertBannerSchema.parse(bannerWithId);
  } catch (error) {
    console.error('Error fetching alert banner from API:', error);
    return null;
  }
}

// Update existing alert banner
export async function updateAlertBanner(id: string, bannerData: Partial<AlertBanner>): Promise<AlertBanner> {
  // Validate the data before sending
  const validatedData = alertBannerSchema.partial().parse(bannerData);
  const { data } = await axiosClient.patch(`/alert-banner/${id}`, validatedData);
  // Validate the response
  return alertBannerSchema.parse(data);
}

// Create a new alert banner if one doesn't exist
export async function createAlertBanner(bannerData: Partial<AlertBanner>): Promise<AlertBanner> {
  // Validate the data before sending
  const validatedData = alertBannerSchema.parse(bannerData);
  const { data } = await axiosClient.post('/alert-banner', validatedData);
  // Validate the response
  return alertBannerSchema.parse(data);
}
