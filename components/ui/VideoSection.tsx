"use client";

import { useAppContext } from '@/contexts/AppContext';
import dynamic from 'next/dynamic';

// Dynamically import components with no SSR
const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });
const YouTubePlayer = dynamic(() => import('./YouTubePlayer'), { ssr: false });
const TwitchPlayer = dynamic(() => import('./TwitchPlayer'), { ssr: false });

export default function VideoSection() {
  const { featureFlags, videoSettings, youtubeSettings } = useAppContext();
  
  // Determine what to show based on priorities:
  // 1. Live stream (if enabled and configured)
  // 2. YouTube video (if enabled and configured)
  // 3. Nothing (if neither is configured)
  
  const showLiveStream = videoSettings.isLive && featureFlags.showVideoPlayer;
  const showTwitch = showLiveStream && videoSettings.twitchChannel;
  const showDirectStream = showLiveStream && videoSettings.src && !showTwitch;
  const showYouTube = !showLiveStream && featureFlags.showYouTubeVideo && youtubeSettings.videoId;
  
  if (!showTwitch && !showDirectStream && !showYouTube) {
    return null; // Don't render the section at all if nothing to show
  }
  
  return (
    <section className="w-full mb-12">
      {showLiveStream && (
        <h2 className="text-2xl font-bold mb-4 text-brand-gold">
          {videoSettings.title || "Live Stream"}
        </h2>
      )}
      
      {!showLiveStream && featureFlags.showYouTubeVideo && (
        <h2 className="text-2xl font-bold mb-4 text-brand-gold">
          {youtubeSettings.title || "Featured Video"}
        </h2>
      )}
      
      {showTwitch ? (
        <TwitchPlayer 
          channel={videoSettings.twitchChannel!} 
          autoplay={videoSettings.autoplay}
          muted={videoSettings.muted}
        />
      ) : showDirectStream ? (
        <VideoPlayer useContextSettings={true} />
      ) : showYouTube ? (
        <YouTubePlayer settings={youtubeSettings} />
      ) : (
        <div className="aspect-video bg-gray-900 flex items-center justify-center text-brand-gold">
          No video or live stream configured
        </div>
      )}
    </section>
  );
} 