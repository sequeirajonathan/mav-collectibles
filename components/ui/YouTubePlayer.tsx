"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface YouTubePlayerProps {
  videoId?: string;
  playlistId?: string;
  autoplay?: boolean;
  muted?: boolean;
  title?: string;
  useContextSettings?: boolean;
}

export default function YouTubePlayer({ 
  videoId, 
  playlistId, 
  autoplay,
  muted,
  title,
  useContextSettings = false
}: YouTubePlayerProps) {
  const [isClient, setIsClient] = useState(false);
  const { youtubeSettings, featureFlags } = useAppContext();

  // If useContextSettings is true, use settings from context
  const settings = useContextSettings ? youtubeSettings : {
    videoId: videoId || '',
    title: title || '',
    autoplay: autoplay || false,
    muted: muted || false,
    playlistId: playlistId || ''
  };
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render if feature flag is off and using context settings
  if (useContextSettings && !featureFlags.showYouTubeVideo) {
    return null;
  }

  // Build the YouTube embed URL with parameters to control behavior
  const embedUrl = `https://www.youtube.com/embed/${settings.videoId}?rel=0&modestbranding=1&color=white&controls=1${
    settings.autoplay === true ? '&autoplay=1' : ''
  }${
    settings.autoplay === true || settings.muted === true ? '&mute=1' : ''
  }${
    settings.playlistId ? `&list=${settings.playlistId}` : ''
  }&enablejsapi=0&origin=${isClient ? encodeURIComponent(window.location.origin) : ''}`;

  if (!isClient) {
    return (
      <div className="aspect-video w-full bg-black/50 flex items-center justify-center">
        <span className="text-[#E6B325]">Loading video player...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2 border-[#E6B325]/30 shadow-lg">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={settings.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
      {settings.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3">
          <h3 className="text-white font-medium truncate">{settings.title}</h3>
        </div>
      )}
      {settings.autoplay && !settings.muted && (
        <div className="absolute top-0 right-0 bg-black/70 p-2 text-xs text-white">
          <p>Note: Browsers require videos to be muted when autoplay is enabled</p>
        </div>
      )}
    </div>
  );
} 