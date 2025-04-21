"use client";

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';

export default function TestVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current) {
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        muted: true,
        sources: [{
          src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
          type: 'application/x-mpegURL'
        }]
      });
      
      return () => {
        player.dispose();
      };
    }
  }, []);
  
  return (
    <div className="w-full">
      <h2 className="text-lg font-bold mb-2">Test Video Player</h2>
      <video ref={videoRef} className="video-js vjs-big-play-centered" width="640" height="360"></video>
    </div>
  );
} 