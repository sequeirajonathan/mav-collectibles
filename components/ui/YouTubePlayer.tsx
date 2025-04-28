"use client";

import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@contexts/AppContext';

interface YouTubePlayerProps {
  videoId?: string;
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  playlistId?: string;
  isLiveStream?: boolean;
  liveStreamId?: string;
  useContextSettings?: boolean;
  onError?: () => void;
}

export default function YouTubePlayer({
  videoId,
  title,
  autoplay = true,
  muted = true,
  playlistId,
  isLiveStream = false,
  liveStreamId,
  useContextSettings = false,
  onError
}: YouTubePlayerProps) {
  const { youtubeSettings } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use settings from context if requested
  const settings = useContextSettings && youtubeSettings ? {
    videoId: youtubeSettings.videoId || '',
    title: youtubeSettings.title || '',
    autoplay: youtubeSettings.autoplay ?? true,
    muted: youtubeSettings.muted ?? true,
    playlistId: youtubeSettings.playlistId || '',
    isLiveStream: youtubeSettings.isLiveStream || false,
    liveStreamId: youtubeSettings.liveStreamId || ''
  } : {
    videoId: videoId || '',
    title: title || '',
    autoplay,
    muted,
    playlistId: playlistId || '',
    isLiveStream,
    liveStreamId: liveStreamId || ''
  };

  // Determine the correct video ID to use
  const effectiveVideoId = settings.isLiveStream && settings.liveStreamId 
    ? settings.liveStreamId 
    : settings.videoId;

  // Handle YouTube URL formats
  useEffect(() => {
    // If the videoId looks like a full YouTube URL, extract the ID
    if (effectiveVideoId && (
      effectiveVideoId.includes('youtube.com') || 
      effectiveVideoId.includes('youtu.be')
    )) {
      try {
        let extractedId = '';
        
        if (effectiveVideoId.includes('youtube.com/watch?v=')) {
          // Regular YouTube video URL
          const url = new URL(effectiveVideoId);
          extractedId = url.searchParams.get('v') || '';
        } else if (effectiveVideoId.includes('youtu.be/')) {
          // Shortened YouTube URL
          const parts = effectiveVideoId.split('youtu.be/');
          extractedId = parts[1]?.split('?')[0] || '';
        } else if (effectiveVideoId.includes('youtube.com/live/')) {
          // YouTube live URL format
          const parts = effectiveVideoId.split('youtube.com/live/');
          extractedId = parts[1]?.split('?')[0] || '';
        }
        
        if (extractedId && iframeRef.current) {
          // Update the iframe src with the extracted ID
          const autoplayParam = settings.autoplay ? '&autoplay=1' : '';
          const mutedParam = settings.muted ? '&mute=1' : '';
          const playlistParam = settings.playlistId ? `&list=${settings.playlistId}` : '';
          
          iframeRef.current.src = `https://www.youtube.com/embed/${extractedId}?rel=0&modestbranding=1&color=white&controls=1${autoplayParam}${mutedParam}${playlistParam}`;
        }
      } catch (e) {
        console.error('Error parsing YouTube URL:', e);
        setError('Invalid YouTube URL');
        if (onError) onError();
      }
    }
  }, [effectiveVideoId, settings.autoplay, settings.muted, settings.playlistId, onError]);

  // Handle loading state
  useEffect(() => {
    const handleLoad = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setError('Failed to load YouTube video');
      if (onError) onError();
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);
      
      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      };
    }
  }, [onError]);

  if (!effectiveVideoId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p>No video ID provided</p>
      </div>
    );
  }

  // Build the YouTube embed URL
  const autoplayParam = settings.autoplay ? '&autoplay=1' : '';
  const mutedParam = settings.muted ? '&mute=1' : '';
  const playlistParam = settings.playlistId ? `&list=${settings.playlistId}` : '';
  
  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${effectiveVideoId}?rel=0&modestbranding=1&color=white&controls=1${autoplayParam}${mutedParam}${playlistParam}`}
        title={settings.title || 'YouTube Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center">
          <p className="text-red-400 mb-2">⚠️ {error}</p>
          <p className="text-white/70 text-sm">Please check your YouTube video settings.</p>
        </div>
      )}
    </div>
  );
} 