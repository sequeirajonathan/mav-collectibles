import { axiosClient } from '@lib/axios';
import { AlertBanner } from '@interfaces';
import { prisma } from '@lib/prisma';

// Fetch the active alert banner
export async function fetchAlertBanner(): Promise<AlertBanner | null> {
  // If we're on the server, use Prisma directly
  if (typeof window === 'undefined') {
    try {
      const alertBanner = await prisma.alertBanner.findFirst({
        where: { enabled: true },
      });
      
      if (!alertBanner) return null;
      
      // Transform the Prisma result to match the AlertBanner type
      return {
        id: alertBanner.id,
        message: alertBanner.message,
        code: alertBanner.code || undefined,
        backgroundColor: alertBanner.backgroundColor,
        textColor: alertBanner.textColor,
        enabled: alertBanner.enabled,
      };
    } catch (error) {
      console.error('Error fetching alert banner from database:', error);
      return null;
    }
  }

  // If we're on the client, use axios
  try {
    const { data } = await axiosClient.get('/api/alert-banner');
    return data;
  } catch (error) {
    console.error('Error fetching alert banner from API:', error);
    return null;
  }
}

// Update existing alert banner
export async function updateAlertBanner(id: string, bannerData: Partial<AlertBanner>): Promise<AlertBanner> {
  const { data } = await axiosClient.patch(`/api/alert-banner/${id}`, bannerData);
  return data;
}

// Create a new alert banner if one doesn't exist
export async function createAlertBanner(bannerData: Partial<AlertBanner>): Promise<AlertBanner> {
  const { data } = await axiosClient.post('/api/alert-banner', bannerData);
  return data;
}
