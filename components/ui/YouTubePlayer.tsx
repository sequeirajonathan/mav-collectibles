"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface YouTubeSettings {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  playlistId?: string;
  isLiveStream?: boolean;
  liveStreamId?: string;
  showLiveIndicator?: boolean;
}

interface YouTubePlayerProps {
  settings?: YouTubeSettings;
  useContextSettings?: boolean;
}

export default function YouTubePlayer({ 
  settings: propSettings,
  useContextSettings = false
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { youtubeSettings: contextSettings } = useAppContext();
  const settings = useContextSettings ? contextSettings : propSettings;
  
  const safeSettings = useMemo(() => settings || {
    videoId: '',
    autoplay: false,
    muted: true,
    isLiveStream: false,
    liveStreamId: '',
    playlistId: ''
  }, [settings]);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    
    let isMounted = true;
    
    try {
      // Create a unique ID for the iframe
      const iframeId = `youtube-player-${Math.random().toString(36).substring(2, 9)}`;
      
      // Clear any existing content
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // Determine what to play
      let src = '';
      if (safeSettings.isLiveStream && safeSettings.liveStreamId) {
        // Use live stream ID if available and live stream mode is on
        src = `https://www.youtube.com/embed/${safeSettings.liveStreamId}?autoplay=${safeSettings.autoplay ? 1 : 0}&mute=${safeSettings.muted ? 1 : 0}`;
      } else if (safeSettings.playlistId) {
        // Use playlist if available
        src = `https://www.youtube.com/embed/videoseries?list=${safeSettings.playlistId}&autoplay=${safeSettings.autoplay ? 1 : 0}&mute=${safeSettings.muted ? 1 : 0}`;
      } else if (safeSettings.videoId) {
        // Use regular video ID
        src = `https://www.youtube.com/embed/${safeSettings.videoId}?autoplay=${safeSettings.autoplay ? 1 : 0}&mute=${safeSettings.muted ? 1 : 0}`;
      } else {
        throw new Error('No video ID or playlist ID provided');
      }
      
      // Create the iframe
      const iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.src = src;
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      
      // Add loading and error handlers
      iframe.onload = () => {
        if (isMounted) {
          setIsLoading(false);
        }
      };
      
      iframe.onerror = () => {
        if (isMounted) {
          setError('Failed to load YouTube video');
          setIsLoading(false);
        }
      };
      
      // Add the iframe to the container
      if (containerRef.current) {
        containerRef.current.appendChild(iframe);
      }
      
      // Set a timeout in case the onload event doesn't fire
      const timeout = setTimeout(() => {
        if (isMounted && isLoading) {
          setIsLoading(false);
        }
      }, 5000);
      
      return () => {
        isMounted = false;
        clearTimeout(timeout);
      };
    } catch (err) {
      console.error('Error setting up YouTube player:', err);
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Error setting up YouTube player');
        setIsLoading(false);
      }
    }
  }, [safeSettings, isLoading]);
  
  if (error) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border-2 border-red-500 shadow-lg aspect-video bg-gray-900 flex items-center justify-center text-white">
        {error}
      </div>
    );
  }
  
  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2 border-[#E6B325]/30 shadow-lg aspect-video">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-brand-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-brand-gold">Loading YouTube video...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
} 