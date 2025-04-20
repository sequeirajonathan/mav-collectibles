"use client";

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import { useAppContext } from '@/contexts/AppContext';

interface VideoPlayerProps {
  src?: string;
  type?: string;
  isLive?: boolean;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  useContextSettings?: boolean;
}

export default function VideoPlayer({
  src,
  type = 'application/x-mpegURL', // Default to HLS
  isLive,
  poster,
  title,
  autoplay,
  muted,
  useContextSettings = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const { videoSettings, featureFlags } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use context settings if specified
  const settings = useContextSettings ? videoSettings : {
    src: src || '',
    type: type || 'application/x-mpegURL',
    isLive: isLive || false,
    poster: poster || '',
    title: title || '',
    autoplay: autoplay || false,
    muted: muted || false
  };

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize video.js player
    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      responsive: true,
      liveui: settings.isLive,
      autoplay: settings.autoplay,
      muted: settings.muted,
      poster: settings.poster,
      sources: [{
        src: settings.src,
        type: settings.type
      }]
    });

    playerRef.current = player;

    // Add live indicator if streaming
    if (settings.isLive) {
      const liveIndicator = document.createElement('div');
      liveIndicator.className = 'vjs-live-indicator';
      liveIndicator.innerHTML = `
        <span class="live-dot"></span>
        <span class="live-text">LIVE</span>
      `;
      player.el().appendChild(liveIndicator);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [settings]);

  if (useContextSettings && !featureFlags.showVideoPlayer) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2 border-[#E6B325]/30 shadow-lg">
      <div data-vjs-player>
        <video 
          ref={videoRef}
          className="video-js vjs-big-play-centered"
        />
      </div>
      
      {settings.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 z-10">
          <h3 className="text-white font-medium truncate">{settings.title}</h3>
        </div>
      )}
    </div>
  );
} 