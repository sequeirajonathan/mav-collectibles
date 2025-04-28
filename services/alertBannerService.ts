import { axiosClient } from '@lib/axios';
import { AlertBanner } from '@interfaces';

// Fetch the active alert banner
export async function fetchAlertBanner(): Promise<AlertBanner | null> {
  const { data } = await axiosClient.get('/api/alert-banner');
  return data;
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
