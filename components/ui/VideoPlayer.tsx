"use client";

import { useEffect, useRef, useMemo, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import { useAppContext } from '@contexts/AppContext';

interface VideoPlayerProps {
  src?: string;
  type?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  fluid?: boolean;
  useContextSettings?: boolean;
  onError?: () => void;
}

const FALLBACK_STREAMS = [
  "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
  "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8"
];

/**
 * VideoPlayer component that supports both HLS streams and Twitch embeds
 * Features:
 * - Fallback streams for HLS playback
 * - Twitch channel embedding
 * - Error handling and recovery
 * - Loading states
 * - Context-based settings
 */
export default function VideoPlayer({
  src,
  type = 'application/x-mpegURL',
  poster = '',
  autoplay = true,
  muted = true,
  controls = true,
  fluid = true,
  useContextSettings = false,
  onError,
}: VideoPlayerProps) {
  const { videoSettings } = useAppContext();
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isTwitch, setIsTwitch] = useState(false);
  const [twitchChannel, setTwitchChannel] = useState('');

  // Use settings from context if requested
  const videoSource = useMemo(() => {
    if (useContextSettings && videoSettings) {
      const source = {
        src: videoSettings.src || '',
        type: videoSettings.type || 'application/x-mpegURL',
        poster: videoSettings.poster || '',
        autoplay: videoSettings.autoplay ?? true,
        muted: videoSettings.muted ?? true,
        title: videoSettings.title || 'Live Stream',
        twitchChannel: videoSettings.twitchChannel || ''
      };
      
      // Check if this is a Twitch URL
      if (source.src.includes('twitch.tv/')) {
        try {
          const url = new URL(source.src);
          const pathParts = url.pathname.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            setIsTwitch(true);
            setTwitchChannel(pathParts[0]);
            return { ...source, twitchChannel: pathParts[0] };
          }
        } catch {
          // Invalid Twitch URL, continue with regular video
          setIsTwitch(false);
          setTwitchChannel('');
        }
      }
      
      return source;
    }
    
    // Handle direct props
    if (src && src.includes('twitch.tv/')) {
      try {
        const url = new URL(src);
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          setIsTwitch(true);
          setTwitchChannel(pathParts[0]);
          return { 
            src, 
            type, 
            poster, 
            autoplay, 
            muted, 
            title: 'Twitch Stream',
            twitchChannel: pathParts[0]
          };
        }
      } catch {
        // Invalid Twitch URL, continue with regular video
        setIsTwitch(false);
        setTwitchChannel('');
      }
    }
    
    return { src, type, poster, autoplay, muted, title: 'Video', twitchChannel: '' };
  }, [useContextSettings, videoSettings, src, type, poster, autoplay, muted]);

  // Regular video.js player for HLS streams
  useEffect(() => {
    // Only initialize video.js if not a Twitch stream
    if (isTwitch && twitchChannel) {
      return; // Skip video.js initialization for Twitch
    }

    // Prevent re-initialization if we've already tried and failed with all fallbacks
    if (hasInitialized && error && videoSource.src && !videoSource.src.includes("fallback")) {
      // Find a fallback that's different from the current source
      const fallback = FALLBACK_STREAMS.find(url => url !== videoSource.src);
      
      if (fallback && playerRef.current) {
        try {
          playerRef.current.src([{
            src: fallback,
            type: 'application/x-mpegURL'
          }]);
          playerRef.current.load();
          playerRef.current.play();
          setError(null);
          setIsLoading(true);
          return;
        } catch {
          // Fallback failed, continue with error state
        }
      }
    }
    
    // Prevent re-initialization if we've already tried and failed
    if (hasInitialized && error) {
      return;
    }
    
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      setIsLoading(true);
      setError(null);
      setHasInitialized(true);
      
      // Check if we have a valid source
      if (!videoSource.src) {
        setError('No video source provided');
        setIsLoading(false);
        return;
      }
      
      // Clear any existing content
      if (videoRef.current.firstChild) {
        videoRef.current.innerHTML = '';
      }
      
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-theme-mav vjs-big-play-centered';
      videoRef.current.appendChild(videoElement);

      try {
        const player = playerRef.current = videojs(videoElement, {
          controls,
          autoplay: videoSource.autoplay,
          muted: videoSource.muted,
          fluid,
          sources: [{
            src: videoSource.src,
            type: videoSource.type
          }],
          poster: videoSource.poster,
          html5: {
            hls: {
              overrideNative: true
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false,
            nativeTextTracks: false
          },
          liveui: true,
          errorDisplay: false // Disable default error display
        });
        
        // Add error handling
        player.on('error', () => {
          const errorObj = player.error();
          if (errorObj) {
            setError(`Error loading video: ${errorObj.message || 'Unknown error'}`);
          }
          setIsLoading(false);
          
          // Call the error handler if provided
          if (onError) {
            onError();
          }
          
          // Prevent continuous retries
          if (playerRef.current) {
            playerRef.current.pause();
          }
        });
        
        player.on('loadedmetadata', () => {
          setIsLoading(false);
        });
        
        // Set a timeout in case the video never loads
        const timeout = setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
            setError('Video timed out while loading');
            
            // Prevent continuous retries
            if (playerRef.current) {
              playerRef.current.pause();
            }
          }
        }, 10000); // 10 second timeout
        
        return () => clearTimeout(timeout);
      } catch {
        setError('Failed to initialize video player');
        setIsLoading(false);
        return;
      }
    }
    
    // Cleanup function
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch {
          // Ignore disposal errors
        }
        playerRef.current = null;
      }
    };
  }, [videoSource.src, videoSource.type, videoSource.poster, videoSource.autoplay, videoSource.muted, controls, fluid, isLoading, error, hasInitialized, onError, isTwitch, twitchChannel]);

  // Render function with conditional for Twitch
  return (
    <div className="relative w-full aspect-video bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-gold"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <p className="text-sm text-gray-400">Please try refreshing the page</p>
          </div>
        </div>
      )}
      
      {isTwitch && twitchChannel ? (
        <iframe
          src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&muted=${muted}&autoplay=${autoplay}`}
          height="100%"
          width="100%"
          allowFullScreen
          className="absolute inset-0"
        />
      ) : (
        <div ref={videoRef} className="w-full h-full" />
      )}
    </div>
  );
} 