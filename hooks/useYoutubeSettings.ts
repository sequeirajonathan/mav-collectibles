import { useResource } from '@lib/swr';
import { YouTubeSettings } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useYoutubeSettings() {
  return useResource<YouTubeSettings>('/youtube-settings/current', {
    onError: (error) => {
      console.error('Failed to fetch YouTube settings:', error);
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('No YouTube settings found');
        } else if (error.status === 500) {
          toast.error('Server error while loading YouTube settings');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading YouTube settings');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else {
          toast.error(error.message || 'Failed to load YouTube settings');
        }
      } else {
        toast.error('Failed to load YouTube settings');
      }
    }
  });
}

export function useUpdateYoutubeSettings() {
  const { update, refresh } = useResource<YouTubeSettings>('/youtube-settings/current');

  return {
    mutate: async (settings: Partial<YouTubeSettings>) => {
      try {
        const result = await update('current', settings);
        await refresh();
        toast.success('YouTube settings updated successfully');
        return result;
      } catch (error) {
        console.error('Failed to update YouTube settings:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to update YouTube settings');
        } else {
          toast.error('Failed to update YouTube settings');
        }
        throw error;
      }
    }
  };
}
