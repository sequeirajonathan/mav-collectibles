"use client";

import { useEffect, useRef, useState } from 'react';

// Define the Twitch global type
declare global {
  interface Window {
    Twitch?: {
      Player: {
        new (
          elementId: string | HTMLElement,
          options: {
            channel: string;
            width: string | number;
            height: string | number;
            autoplay?: boolean;
            muted?: boolean;
          }
        ): {
          destroy: () => void;
          addEventListener: (event: string, callback: () => void) => void;
        };
        READY: string;
        ERROR: string;
      };
    };
  }
}

interface TwitchPlayerProps {
  channel: string;
  autoplay?: boolean;
  muted?: boolean;
}

export default function TwitchPlayer({
  channel,
  autoplay = true,
  muted = true
}: TwitchPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setPlayerReady] = useState(false);

  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let scriptElement: HTMLScriptElement | null = null;
    
    try {
      // Create a unique ID for the container
      const playerId = `twitch-player-${Math.random().toString(36).substring(2, 9)}`;
      
      if (containerRef.current) {
        containerRef.current.id = playerId;
      }

      // Check if Twitch script is already loaded
      if (window.Twitch) {
        // Twitch is already available, create player directly
        if (containerRef.current && isMounted) {
          try {
            const player = new window.Twitch.Player(playerId, {
              channel,
              width: '100%',
              height: '100%',
              autoplay,
              muted,
            });
            
            // Add event listener for player ready
            player.addEventListener(window.Twitch.Player.READY, () => {
              if (isMounted) {
                setPlayerReady(true);
                setIsLoading(false);
              }
            });
            
            // Add event listener for player error
            player.addEventListener(window.Twitch.Player.ERROR, () => {
              if (isMounted) {
                setError('Error loading Twitch stream');
                setIsLoading(false);
              }
            });
          } catch (err) {
            console.error('Error creating Twitch player:', err);
            if (isMounted) {
              setError('Failed to load Twitch player');
              setIsLoading(false);
            }
          }
        }
      } else {
        // Load Twitch script
        scriptElement = document.createElement('script');
        scriptElement.src = 'https://player.twitch.tv/js/embed/v1.js';
        scriptElement.async = true;
        
        scriptElement.onload = () => {
          if (!isMounted) return;
          
          // Create player after script loads
          if (containerRef.current && window.Twitch) {
            try {
              const player = new window.Twitch.Player(playerId, {
                channel,
                width: '100%',
                height: '100%',
                autoplay,
                muted,
              });
              
              // Add event listener for player ready
              player.addEventListener(window.Twitch.Player.READY, () => {
                if (isMounted) {
                  setPlayerReady(true);
                  setIsLoading(false);
                }
              });
              
              // Add event listener for player error
              player.addEventListener(window.Twitch.Player.ERROR, () => {
                if (isMounted) {
                  setError('Error loading Twitch stream');
                  setIsLoading(false);
                }
              });
              
              // Set a timeout in case the events don't fire
              setTimeout(() => {
                if (isMounted && isLoading) {
                  setIsLoading(false);
                }
              }, 5000);
            } catch (err) {
              console.error('Error creating Twitch player:', err);
              if (isMounted) {
                setError('Failed to load Twitch player');
                setIsLoading(false);
              }
            }
          }
        };
        
        scriptElement.onerror = () => {
          if (isMounted) {
            setError('Failed to load Twitch player script');
            setIsLoading(false);
          }
        };
        
        document.body.appendChild(scriptElement);
      }
    } catch (err) {
      console.error('Error in Twitch player setup:', err);
      if (isMounted) {
        setError('Error setting up Twitch player');
        setIsLoading(false);
      }
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      
      // Remove script if we added it
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [channel, autoplay, muted, isLoading]);

  if (error) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border-2 border-red-500 shadow-lg aspect-video bg-gray-900 flex items-center justify-center text-white">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2 border-[#E6B325]/30 shadow-lg aspect-video">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-brand-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-brand-gold">Loading Twitch stream...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
} 