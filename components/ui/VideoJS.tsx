"use client";

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';

interface VideoJSProps {
  options: any;
  onReady?: (player: any) => void;
}

export const VideoJS: React.FC<VideoJSProps> = ({ options, onReady }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      if (!videoRef.current) return;

      // Create video element
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-mav');
      videoRef.current.appendChild(videoElement);

      // Initialize player
      const player = playerRef.current = videojs(videoElement, options, () => {
        console.log('Player is ready');
        onReady && onReady(player);
      });
    } else {
      // Update player options if they change
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      
      if (options.sources) {
        player.src(options.sources);
      }
    }
  }, [options, videoRef, onReady]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full">
      <div ref={videoRef} className="w-full" />
    </div>
  );
};

export default VideoJS; 