"use client";

import { useAppContext } from '@/contexts/AppContext';

export default function DebugInfo() {
  const { featureFlags, videoSettings, youtubeSettings } = useAppContext();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h4 className="font-bold mb-2">Current Settings</h4>
      <p>Live Stream: {videoSettings.isLive ? 'On' : 'Off'}</p>
      <p>Twitch Channel: {videoSettings.twitchChannel || 'none'}</p>
      <p>YouTube ID: {youtubeSettings.videoId || 'none'}</p>
      <p>Show Video Player: {featureFlags.showVideoPlayer ? 'Yes' : 'No'}</p>
      <p>Show YouTube: {featureFlags.showYouTubeVideo ? 'Yes' : 'No'}</p>
    </div>
  );
} 