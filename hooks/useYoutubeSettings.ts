import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchYoutubeSettings, updateYoutubeSettings } from '@services/youtubeService';
import { YouTubeSettings } from '@interfaces';

export function useYoutubeSettings() {
  return useQuery<YouTubeSettings>({
    queryKey: ['youtubeSettings'],
    queryFn: fetchYoutubeSettings,
  });
}

export function useUpdateYoutubeSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<YouTubeSettings>) => updateYoutubeSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtubeSettings'] });
    },
  });
}
