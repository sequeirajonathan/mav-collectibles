"use client";

import { useAppContext } from '@/contexts/AppContext';
import YouTubePlayer from './YouTubePlayer';

export default function YouTubeSection() {
  const { featureFlags } = useAppContext();
  
  console.log("Feature flag for YouTube:", featureFlags.showYouTubeVideo);
  
  if (!featureFlags.showYouTubeVideo) {
    console.log("YouTube section hidden due to feature flag");
    return null;
  }
  
  return (
    <section className="w-full max-w-6xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-brand-gold">Featured Video</h2>
      <YouTubePlayer useContextSettings={true} />
    </section>
  );
} 