"use client";

import { useState, useEffect } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  playlistId?: string;
  autoplay?: boolean;
  muted?: boolean;
  title?: string;
}

export default function YouTubePlayer({ 
  videoId, 
  playlistId, 
  autoplay = false, 
  muted = false,
  title
}: YouTubePlayerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Build the YouTube embed URL with parameters to control behavior
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&color=white&controls=1${autoplay ? '&autoplay=1' : ''}${muted ? '&mute=1' : ''}${playlistId ? `&list=${playlistId}` : ''}`;

  if (!isClient) {
    // Return a placeholder while on server
    return (
      <div className="aspect-video w-full bg-black/50 flex items-center justify-center">
        <span className="text-[#E6B325]">Loading video player...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2 border-[#E6B325]/30 shadow-lg">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={title || "YouTube video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3">
          <h3 className="text-white font-medium truncate">{title}</h3>
        </div>
      )}
    </div>
  );
} 