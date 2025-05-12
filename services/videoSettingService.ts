import { axiosClient } from '@lib/axios';
import { VideoSettings } from '@interfaces';

// Fetch the current video settings
export async function fetchVideoSettings(): Promise<VideoSettings> {
  const { data } = await axiosClient.get('/video-settings/current');
  return data;
}

// Update the video settings
export async function updateVideoSettings(settings: Partial<VideoSettings>): Promise<VideoSettings> {
  const { data } = await axiosClient.put('/video-settings/current', settings);
  return data;
}
