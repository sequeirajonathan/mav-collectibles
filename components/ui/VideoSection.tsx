"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@contexts/AppContext';
import YouTubePlayer from './YouTubePlayer';
import VideoPlayer from './VideoPlayer';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function VideoSection() {
  const { youtubeSettings, videoSettings, getFeatureFlag } = useAppContext();
  const [videoReady, setVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Check feature flags
  const isVideoSectionEnabled = getFeatureFlag('showVideoPlayer');
  const isYouTubeEnabled = getFeatureFlag('showYouTubeVideo');
  const isDirectStreamingEnabled = getFeatureFlag('showDirectStreaming');
  
  // Determine which video type to show (if any)
  const hasYouTubeVideo = isVideoSectionEnabled && isYouTubeEnabled && youtubeSettings && (
    youtubeSettings.videoId || 
    (youtubeSettings.isLiveStream && youtubeSettings.liveStreamId) ||
    youtubeSettings.playlistId
  );
  
  const hasDirectVideo = isVideoSectionEnabled && isDirectStreamingEnabled && videoSettings && videoSettings.src;
  
  // Determine if we have any video to show
  const hasVideo = hasYouTubeVideo || hasDirectVideo;
  
  // Determine which video type has priority (if both are available)
  // This shouldn't happen with our mutual exclusivity, but just in case
  const videoType = hasDirectVideo ? 'direct' : (hasYouTubeVideo ? 'youtube' : null);

  // Only start the video loading timer if we actually have a video to show
  useEffect(() => {
    // Don't do anything if no video is available
    if (!hasVideo) return;
    
    // Don't restart the timer if video is already ready
    if (videoReady) return;
    
    const timer = setTimeout(() => {
      setVideoReady(true);
      // Add a small delay before showing the video with animation
      setTimeout(() => setShowVideo(true), 500);
    }, 3000); // Show preloader for at least 3 seconds

    return () => clearTimeout(timer);
  }, [hasVideo, videoReady]);
  
  // Reset states if video availability changes
  useEffect(() => {
    if (!hasVideo) {
      setVideoReady(false);
      setShowVideo(false);
    }
  }, [hasVideo]);

  // Always show the banner if there's no video or if video isn't ready yet
  const showBanner = !hasVideo || !videoReady || !showVideo;

  // Add a handler for video errors
  const handleVideoError = () => {
    setVideoError(true); // Set the error state to true
    // Show the banner again when video fails
    setShowVideo(false);
  };

  return (
    <div className="w-full mb-8 relative overflow-x-hidden">
      {/* Banner - always shown when no video is available */}
      {showBanner && (
        <div className="relative" style={{ 
          paddingBottom: "28%", // More compact aspect ratio
          maxHeight: "400px" // Fixed maximum height
        }}>
          <motion.div 
            className="absolute inset-0 sm:left-[-5%] sm:right-[-5%] md:left-[-10%] md:right-[-10%] lg:left-[-15%] lg:right-[-15%] top-0 bottom-0 z-20"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-full h-full relative overflow-hidden rounded-md">
              {/* Cinematic vignette overlay */}
              <div className="absolute inset-0 z-5 pointer-events-none" 
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
                  mixBlendMode: 'multiply'
                }}
              />
              
              <Image 
                src="/banner.gif" 
                alt="MAV Collectibles" 
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 110vw, (max-width: 1024px) 120vw, 130vw"
                style={{ objectPosition: '50% 25%' }} // Adjusted to show more of the top portion
                unoptimized
              />
              
              {/* Dramatic lighting gradient - reduced opacity */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              
              {/* Cinematic lens flare effect */}
              <div className="absolute top-[20%] right-[30%] w-[100px] h-[100px] rounded-full opacity-15 blur-lg"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                  animation: 'pulse 3s infinite alternate'
                }}
              />
              
              {/* Pokemon-style MAV Collectibles overlay - adjusted size */}
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center w-full"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]" 
                    style={{ 
                      fontFamily: "'Press Start 2P', system-ui", 
                      textShadow: "2px 2px 0 #3B4CCA, -2px -2px 0 #3B4CCA, 2px -2px 0 #3B4CCA, -2px 2px 0 #3B4CCA, 0 0 15px rgba(255,203,5,0.7)"
                    }}>
                  MAV Collectibles
                </h1>
                <p className="mt-1 text-base text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Your Premier TCG Destination
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Video container - only shown if we have a video to display */}
      {hasVideo && showVideo && !showBanner && (
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="w-full relative rounded-lg border border-[#E6B325]/20 shadow-lg overflow-hidden"
            style={{ 
              aspectRatio: "16/9", // Standard video aspect ratio
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { 
                type: "spring", 
                duration: 1,
                bounce: 0.3,
                delay: 0.2
              }
            }}
          >
            {/* Render the appropriate video player based on type */}
            <div className="absolute inset-0">
              {videoType === 'youtube' && <YouTubePlayer useContextSettings={true} onError={handleVideoError} />}
              {videoType === 'direct' && <VideoPlayer useContextSettings={true} onError={handleVideoError} />}
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Add some CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.1; transform: scale(0.95); }
          100% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>

      {videoError && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-md text-center">
            There was an error loading the video. Please try again later.
          </div>
        </div>
      )}
    </div>
  );
} 