import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVideoSettings, updateVideoSettings } from '@services/videoSettingService';
import { VideoSettings } from '@interfaces';

export function useVideoSettings() {
  return useQuery<VideoSettings>({
    queryKey: ['videoSettings'],
    queryFn: fetchVideoSettings,
  });
}

export function useUpdateVideoSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<VideoSettings>) => updateVideoSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoSettings'] });
    },
  });
}
