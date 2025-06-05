import { useResource } from '@lib/swr';
import { YouTubeSettings } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useYoutubeSettings() {
  return useResource<YouTubeSettings>('/youtube-settings/current', {
    onError: (error) => {
      console.error('Failed to fetch YouTube settings:', error);
      toast.error('Failed to load YouTube settings');
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
        toast.error('Failed to update YouTube settings');
        throw error;
      }
    }
  };
}
