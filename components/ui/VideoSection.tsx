"use client";

import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@contexts/AppContext';
import YouTubePlayer from './YouTubePlayer';
import VideoPlayer from './VideoPlayer';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_CDN = {
  fallbackImage: "https://ubkfii3geuyo44gn.public.blob.vercel-storage.com/banner-fallback-da01abj14MnxqTeGQHExu1vyzYU8dt.jpg",
  webm: "https://ubkfii3geuyo44gn.public.blob.vercel-storage.com/banner_1-VWhXWdrcAt4XrnuciQmV6nXgjO1mSb.webm",
  mp4: "https://ubkfii3geuyo44gn.public.blob.vercel-storage.com/banner_2_5-QCGuDaJzZ6ezLznNqGr6umGNPDgx2p.mp4"
};

/**
 * VideoSection component that displays either a YouTube video, direct video stream, or fallback banner
 * Features:
 * - Feature flag-based video selection
 * - Smooth transitions and animations
 * - Fallback handling
 * - Error recovery
 * - Loading states
 */
export default function VideoSection() {
  const { videoSettings, getFeatureFlag } = useAppContext();
  const [videoReady, setVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const isVideoSectionEnabled = getFeatureFlag('showVideoPlayer');
  const isYouTubeEnabled = getFeatureFlag('showYouTubeVideo');
  const isDirectStreamingEnabled = getFeatureFlag('showDirectStreaming');

  const hasYouTubeVideo = mounted && isVideoSectionEnabled && isYouTubeEnabled && !!videoSettings;

  const hasDirectVideo = mounted && isVideoSectionEnabled && isDirectStreamingEnabled && videoSettings && videoSettings.src;
  const hasVideo = hasYouTubeVideo || hasDirectVideo;
  const videoType = hasDirectVideo ? 'direct' : (hasYouTubeVideo ? 'youtube' : null);

  // Handle video ready state
  useEffect(() => {
    if (!hasVideo || videoReady) return;

    const timer = setTimeout(() => {
      setVideoReady(true);
      setTimeout(() => setShowVideo(true), 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasVideo, videoReady]);

  // Reset video states when hasVideo changes
  useEffect(() => {
    if (!hasVideo) {
      setVideoReady(false);
      setShowVideo(false);
      setVideoLoaded(false);
      setVideoPlaying(false);
    }
  }, [hasVideo]);

  // Preload fallback image
  useEffect(() => {
    if (!mounted) return;
    
    const img = new Image();
    img.src = VIDEO_CDN.fallbackImage;
  }, [mounted]);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setTimeout(() => setVideoPlaying(true), 100);
  };

  const handleVideoPlaying = () => setVideoPlaying(true);

  const handleVideoError = () => {
    setVideoError(true);
    setVideoLoaded(false);
    setVideoPlaying(false);
  };

  // Handle video element events
  useEffect(() => {
    if (!mounted) return;
    
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoad = () => handleVideoLoad();
    const handlePlaying = () => handleVideoPlaying();
    const handleError = () => handleVideoError();

    videoElement.addEventListener('loadeddata', handleLoad);
    videoElement.addEventListener('canplay', handleLoad);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('error', handleError);

    if (videoElement.readyState >= 3) {
      handleVideoLoad();
    }

    const timeout = setTimeout(() => {
      if (!videoLoaded) {
        handleVideoError();
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      videoElement.removeEventListener('loadeddata', handleLoad);
      videoElement.removeEventListener('canplay', handleLoad);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('error', handleError);
    };
  }, [mounted, videoLoaded]);

  const showBanner = !hasVideo || !videoReady || !showVideo;

  const handlePlayerError = () => {
    setVideoError(true);
    setShowVideo(false);
  };

  const backgroundStyle = {
    backgroundImage: `url("${VIDEO_CDN.fallbackImage}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center 25%',
    backgroundColor: '#000'
  };

  // Server-side render fallback
  if (!mounted) {
    return (
      <div className="w-full mb-8 relative overflow-x-hidden bg-black">
        <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "400px" }}>
          <div className="absolute inset-0 bg-black" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-8 relative overflow-x-hidden bg-black">
      <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "400px" }}>
        {showBanner && (
          <motion.div
            className="absolute inset-0 sm:left-[-5%] sm:right-[-5%] md:left-[-10%] md:right-[-10%] lg:left-[-15%] lg:right-[-15%] top-0 bottom-0 z-20"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div
              className="w-full h-full relative overflow-hidden rounded-md bg-black"
              style={videoError ? backgroundStyle : undefined}
            >
              {/* Pulse Background Animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black"
                initial={{ opacity: 1 }}
                animate={{
                  opacity: videoLoaded ? 0 : [0.7, 0.9, 0.7],
                  x: videoLoaded ? 0 : ["-100%", "100%", "-100%"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              {/* Radial Shadow Overlay */}
              <div className="absolute inset-0 z-5 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
                  mixBlendMode: 'multiply'
                }}
              />

              {/* Video */}
              <AnimatePresence>
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: videoPlaying ? 1 : 0,
                    scale: videoPlaying ? 1 : 1.02
                  }}
                  transition={{
                    opacity: { duration: 1.2, ease: "easeOut" },
                    scale: { duration: 1.5, ease: "easeOut" }
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="absolute w-full h-full object-cover object-center"
                    style={{ objectPosition: '50% 25%' }}
                    onError={handleVideoError}
                    poster={VIDEO_CDN.fallbackImage}
                  >
                    <source src={VIDEO_CDN.webm} type="video/webm" />
                    <source src={VIDEO_CDN.mp4} type="video/mp4" />
                  </video>
                </motion.div>
              </AnimatePresence>

              {/* Lighting Effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

              {/* Lens Flare */}
              <div className="absolute top-[20%] right-[30%] w-[100px] h-[100px] rounded-full opacity-15 blur-lg"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                  animation: 'pulse 3s infinite alternate'
                }}
              />

              {/* Centered Titles */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center w-full"
                initial={{ opacity: 0.9, y: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: videoPlaying ? 1 : [0.98, 1.02, 0.98]
                }}
                transition={{
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                  style={{ fontFamily: "'Press Start 2P', system-ui", textShadow: "2px 2px 0 #3B4CCA" }}>
                  MAV Collectibles
                </h1>
                <p className="mt-1 text-base text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Your Premier TCG Destination
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Video Players */}
        {showVideo && !videoError && (
          <AnimatePresence>
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {videoType === 'youtube' && (
                <YouTubePlayer
                  useContextSettings={true}
                  onError={handlePlayerError}
                />
              )}
              {videoType === 'direct' && (
                <VideoPlayer
                  useContextSettings={true}
                  onError={handlePlayerError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.1; transform: scale(0.95); }
          100% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
