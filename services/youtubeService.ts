import { axiosClient } from '@lib/axios';
import { YouTubeSettings } from '@interfaces';

// Fetch the current YouTube settings
export async function fetchYoutubeSettings(): Promise<YouTubeSettings> {
  const { data } = await axiosClient.get('/api/youtube-settings/1');
  return data;
}

// Update the YouTube settings
export async function updateYoutubeSettings(settings: Partial<YouTubeSettings>): Promise<YouTubeSettings> {
  const { data } = await axiosClient.put('/api/youtube-settings/1', settings);
  return data;
}
