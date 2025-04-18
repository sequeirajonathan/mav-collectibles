"use client";

import { useState } from 'react';
import VideoJS from './VideoJS';
import '@/app/videojs-theme.css';
import videojs from 'video.js';

// Define the VideoJsPlayer type
type VideoJsPlayer = ReturnType<typeof videojs>;

// Replace with your actual YouTube video ID
// You can get the video ID from the YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID_HERE
const featuredVideo = {
  id: 'V8D_ELNVRko', // Your video ID
};

export default function YouTubeSection() {
  // Use an underscore prefix to indicate intentionally unused variable
  // Or just use setState directly without the state variable
  const [, setPlayer] = useState<VideoJsPlayer | null>(null);

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

  const handlePlayerReady = (player: VideoJsPlayer) => {
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