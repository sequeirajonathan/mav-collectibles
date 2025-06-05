import { useResource } from '@lib/swr';
import { VideoSettings } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useVideoSettings() {
  return useResource<VideoSettings>('/video-settings/current', {
    onError: (error) => {
      console.error('Failed to fetch video settings:', error);
      toast.error('Failed to load video settings');
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
        toast.error('Failed to update video settings');
        throw error;
      }
    }
  };
}
