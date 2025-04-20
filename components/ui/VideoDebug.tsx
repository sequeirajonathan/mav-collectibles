"use client";

import { useAppContext } from '@/contexts/AppContext';

export default function VideoDebug() {
  const { featureFlags, videoSettings } = useAppContext();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-0 right-0 bg-black/80 text-white p-4 text-xs max-w-xs overflow-auto max-h-60 z-50">
      <h3 className="font-bold mb-2">Video Debug</h3>
      <div>
        <p>showVideoPlayer: {featureFlags.showVideoPlayer ? 'true' : 'false'}</p>
        <p>isLive: {videoSettings.isLive ? 'true' : 'false'}</p>
        <p>twitchChannel: {videoSettings.twitchChannel || 'none'}</p>
        <p>src: {videoSettings.src || 'none'}</p>
        <p>type: {videoSettings.type}</p>
      </div>
    </div>
  );
} 