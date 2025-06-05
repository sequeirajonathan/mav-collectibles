"use client";

import { useFeatureFlags } from '@hooks/useFeatureFlag';
import { useYoutubeSettings } from '@hooks/useYoutubeSettings';
import YouTubePlayer from './YouTubePlayer';

export default function YouTubeSection() {
  const { data: featureFlags } = useFeatureFlags();
  const { data: youtubeSettings, isLoading } = useYoutubeSettings();
  
  const showYouTubeVideo = featureFlags?.find(f => f.name === 'showYouTubeVideo')?.enabled;
  
  if (!showYouTubeVideo || isLoading || !youtubeSettings) {
    return null;
  }
  
  return (
    <section className="w-full max-w-6xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-[#E6B325]">
        {youtubeSettings.isLiveStream ? 'Live Stream' : 'Featured Video'}
      </h2>
      <YouTubePlayer useContextSettings={true} />
    </section>
  );
} 