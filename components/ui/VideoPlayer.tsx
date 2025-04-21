"use client";

import { useEffect, useRef, useMemo, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import { useAppContext } from '@/contexts/AppContext';

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
  debug?: boolean;
}

const FALLBACK_STREAMS = [
  "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
  "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8"
];

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
  debug = false,
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
        } catch (e) {
          console.error('Error parsing Twitch URL:', e);
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
      } catch (e) {
        console.error('Error parsing Twitch URL:', e);
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
      // Try a fallback stream
      console.log("Trying fallback stream...");
      
      // Find a fallback that's different from the current source
      const fallback = FALLBACK_STREAMS.find(url => url !== videoSource.src);
      
      if (fallback) {
        // Update the source with a fallback
        if (playerRef.current) {
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
          } catch (e) {
            console.error("Error setting fallback source:", e);
          }
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
            console.error('Video.js error:', errorObj.code, errorObj.message);
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
      } catch (e) {
        console.error('Error initializing video player:', e);
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
        } catch (e) {
          console.error('Error disposing video player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [videoSource.src, videoSource.type, videoSource.poster, videoSource.autoplay, videoSource.muted, controls, fluid, isLoading, error, hasInitialized, onError, isTwitch, twitchChannel]);

  // Render function with conditional for Twitch
  return (
    <div className="relative w-full h-full">
      {isTwitch && twitchChannel ? (
        // Twitch embed
        <>
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&autoplay=${videoSource.autoplay ? 'true' : 'false'}&muted=${videoSource.muted ? 'true' : 'false'}`}
            height="100%"
            width="100%"
            allowFullScreen
            title={`${twitchChannel} on Twitch`}
          ></iframe>
          
          {debug && (
            <div className="absolute top-0 left-0 right-0 bg-black/80 p-2 z-20 text-xs text-white">
              <p>Type: Twitch Embed</p>
              <p>Channel: {twitchChannel}</p>
              <p>Autoplay: {videoSource.autoplay ? 'Yes' : 'No'}</p>
              <p>Muted: {videoSource.muted ? 'Yes' : 'No'}</p>
            </div>
          )}
        </>
      ) : (
        // Regular video.js player
        <>
          <div ref={videoRef} className="w-full h-full">
            {/* Video.js will replace this div with the video element */}
          </div>
          
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center">
              <p className="text-red-400 mb-2">⚠️ {error}</p>
              <p className="text-white/70 text-sm">Please check your stream settings or try again later.</p>
            </div>
          )}
          
          {videoSource.title && !error && !isLoading && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 z-10">
              <h3 className="text-white font-medium truncate">{videoSource.title}</h3>
            </div>
          )}
        </>
      )}
      
      {debug && !isTwitch && (
        <div className="absolute top-0 left-0 right-0 bg-black/80 p-2 z-20 text-xs text-white">
          <p>Source: {videoSource.src}</p>
          <p>Type: {videoSource.type}</p>
          <p>State: {error ? 'Error' : (isLoading ? 'Loading' : 'Ready')}</p>
          {error && <p className="text-red-400">Error: {error}</p>}
        </div>
      )}
    </div>
  );
} 