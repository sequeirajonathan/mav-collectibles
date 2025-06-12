import { useResource } from '@lib/swr';
import { VideoSettings } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useVideoSettings() {
  return useResource<VideoSettings>('/video-settings/current', {
    onError: (error) => {
      console.error('Failed to fetch video settings:', error);
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('No video settings found');
        } else if (error.status === 500) {
          toast.error('Server error while loading video settings');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading video settings');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else {
          toast.error(error.message || 'Failed to load video settings');
        }
      } else {
        toast.error('Failed to load video settings');
      }
    }
  });
}

export function useUpdateVideoSettings() {
  const { update, refresh } = useResource<VideoSettings>('/video-settings/current');

  return {
    mutate: async (settings: Partial<VideoSettings>) => {
      try {
        const result = await update('current', settings);
        await refresh();
        toast.success('Video settings updated successfully');
        return result;
      } catch (error) {
        console.error('Failed to update video settings:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to update video settings');
        } else {
          toast.error('Failed to update video settings');
        }
        throw error;
      }
    }
  };
}
