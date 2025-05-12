import { axiosClient } from '@lib/axios';
import { YouTubeSettings } from '@interfaces';

// Fetch the current YouTube settings
export async function fetchYoutubeSettings(): Promise<YouTubeSettings> {
  const { data } = await axiosClient.get('/youtube-settings/current');
  return data;
}

// Update the YouTube settings
export async function updateYoutubeSettings(settings: Partial<YouTubeSettings>): Promise<YouTubeSettings> {
  const { data } = await axiosClient.put('/youtube-settings/current', settings);
  return data;
}
