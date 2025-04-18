"use client";

import { useState } from 'react';
import VideoJS from './VideoJS';
import '@/app/videojs-theme.css';

// Replace with your actual YouTube video ID
// You can get the video ID from the YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID_HERE
const featuredVideo = {
  id: 'V8D_ELNVRko', // Your video ID
};

export default function YouTubeSection() {
  const [player, setPlayer] = useState<any>(null);

  const videoJsOptions = {
    autoplay: true,
    muted: true,
    controls: true,
    responsive: true,
    fluid: true,
    fill: true,
    techOrder: ['youtube'],
    sources: [{
      type: 'video/youtube',
      src: `https://www.youtube.com/watch?v=${featuredVideo.id}`
    }],
    youtube: {
      ytControls: 0,
      enablePrivacyEnhancedMode: true,
      rel: 0
    }
  };

  const handlePlayerReady = (player: any) => {
    setPlayer(player);
  };

  return (
    <section className="py-8 bg-black w-full">
      {/* Full-width video player with no margins */}
      <div className="w-full" style={{ maxWidth: '100%', height: 'auto', aspectRatio: '16/9' }}>
        <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
      </div>
    </section>
  );
} 