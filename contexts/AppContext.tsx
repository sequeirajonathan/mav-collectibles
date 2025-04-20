"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { config } from '@/lib/config';
import { toast } from 'react-hot-toast';

// Define types
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export interface AlertBanner {
  id: string;
  message: string;
  code?: string;
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
}

export interface FeaturedEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  bulletPoints: string[];
  link?: string;
  enabled: boolean;
  order: number;
}

interface FeatureFlags {
  showAlertBanner: boolean;
  showFeaturedEvents: boolean;
  showYouTubeVideo: boolean;
  showVideoPlayer: boolean;
}

interface YouTubeSettings {
  videoId: string;
  title: string;
  autoplay: boolean;
  muted: boolean;
  playlistId: string;
  isLiveStream: boolean;
  liveStreamId: string;
  showLiveIndicator: boolean;
}

interface VideoSettings {
  src: string;
  type: string;
  isLive: boolean;
  poster: string;
  title: string;
  autoplay: boolean;
  muted: boolean;
  twitchChannel?: string;
}

interface LastUpdated {
  featureFlags?: string;
  alertBanner?: string;
  featuredEvents?: string;
  youtubeSettings?: string;
  videoSettings?: string;
}

interface AdminVideoSettings {
  src: string;
  type: string;
  isLive: boolean;
  poster: string;
  title: string;
  autoplay: boolean;
  muted: boolean;
  twitchChannel?: string;
}

interface AppContextType {
  featureFlags: FeatureFlags;
  alertBanner: AlertBanner | null;
  featuredEvents: FeaturedEvent[];
  updateFeatureFlag: (name: string, enabled: boolean) => Promise<boolean>;
  updateAlertBanner: (data: Partial<AlertBanner>) => Promise<void>;
  updateFeaturedEvent: (id: string, data: Partial<FeaturedEvent>) => Promise<void>;
  addFeaturedEvent: (data: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeFeaturedEvent: (id: string) => Promise<void>;
  dismissAlertBanner: () => void;
  alertBannerDismissed: boolean;
  isLoading: boolean;
  youtubeSettings: YouTubeSettings;
  updateYoutubeSettings: (settings: Partial<YouTubeSettings>) => Promise<void>;
  videoSettings: VideoSettings;
  updateVideoSettings: (settings: AdminVideoSettings) => Promise<void>;
  refreshData: () => Promise<void>;
  lastUpdated: LastUpdated;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    showAlertBanner: true,
    showFeaturedEvents: true,
    showYouTubeVideo: true,
    showVideoPlayer: true,
  });
  const [alertBanner, setAlertBanner] = useState<AlertBanner | null>(null);
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);
  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [youtubeSettings, setYoutubeSettings] = useState<YouTubeSettings>({
    videoId: 'V8D_ELNVRko',
    title: 'Featured Video',
    autoplay: true,
    muted: true,
    playlistId: '',
    isLiveStream: false,
    liveStreamId: '',
    showLiveIndicator: false
  });
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    src: '',
    type: 'application/x-mpegURL',
    isLive: false,
    poster: '',
    title: 'Live Stream',
    autoplay: true,
    muted: true
  });
  const [lastUpdated, setLastUpdated] = useState<LastUpdated>({});

  // Load data on initial render
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch feature flags
      const flagsResponse = await fetch(`${config.baseUrl}/api/feature-flags`);
      if (flagsResponse.ok) {
        const flagsData = await flagsResponse.json();
        if (flagsData && Array.isArray(flagsData)) {
          const flags: FeatureFlags = {
            showAlertBanner: false,
            showFeaturedEvents: false,
            showYouTubeVideo: false,
            showVideoPlayer: false
          };
          
          flagsData.forEach((flag: FeatureFlag) => {
            if (flag.name in flags) {
              flags[flag.name as keyof FeatureFlags] = flag.enabled;
            }
          });
          
          setFeatureFlags(flags);
          setLastUpdated(prev => ({ ...prev, featureFlags: new Date().toISOString() }));
        }
      }
      
      // Fetch alert banner
      const bannerResponse = await fetch(`${config.baseUrl}/api/alert-banner`);
      if (bannerResponse.ok) {
        const bannerData = await bannerResponse.json();
        if (bannerData) {
          setAlertBanner(bannerData);
          setLastUpdated(prev => ({ ...prev, alertBanner: new Date().toISOString() }));
        }
      }
      
      // Fetch featured events
      const eventsResponse = await fetch(`${config.baseUrl}/api/featured-events`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        if (eventsData && Array.isArray(eventsData)) {
          setFeaturedEvents(eventsData);
          setLastUpdated(prev => ({ ...prev, featuredEvents: new Date().toISOString() }));
        }
      }
      
      // Fetch YouTube settings
      const youtubeResponse = await fetch(`${config.baseUrl}/api/youtube-settings/1`);
      if (youtubeResponse.ok) {
        const youtubeData = await youtubeResponse.json();
        if (youtubeData) {
          setYoutubeSettings(youtubeData);
          setLastUpdated(prev => ({ ...prev, youtubeSettings: new Date().toISOString() }));
        }
      }
      
      // Fetch video settings
      const videoResponse = await fetch(`${config.baseUrl}/api/video-settings/1`);
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        if (videoData) {
          setVideoSettings(videoData);
          setLastUpdated(prev => ({ ...prev, videoSettings: new Date().toISOString() }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Update feature flag
  const updateFeatureFlag = async (name: string, enabled: boolean): Promise<boolean> => {
    try {
      console.log(`Updating feature flag: ${name} to ${enabled}`);
      
      // Find the flag ID first
      const flagsResponse = await fetch(`${config.baseUrl}/api/feature-flags`);
      if (flagsResponse.ok) {
        const flagsData = await flagsResponse.json();
        const flag = flagsData.find((f: FeatureFlag) => f.name === name);
        
        if (!flag) {
          console.error(`Feature flag ${name} not found`);
          toast.error(`Feature flag ${name} not found. Please run the database seeder.`);
          return false;
        }
        
        // Now update the flag with the correct ID
        const response = await fetch(`${config.baseUrl}/api/feature-flags/${flag.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Update local state immediately for better UX
        setFeatureFlags(prev => ({
          ...prev,
          [name]: enabled
        }));
        
        // Refresh data to ensure we have the latest state
        await fetchData();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating feature flag:', error);
      return false;
    }
  };

  // Update alert banner
  const updateAlertBanner = async (data: Partial<AlertBanner>) => {
    try {
      if (alertBanner) {
        const response = await fetch(`${config.baseUrl}/api/alert-banner/${alertBanner.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const responseData = await response.json();
        setAlertBanner(responseData);
        setLastUpdated(prev => ({ ...prev, alertBanner: new Date().toISOString() }));
      } else {
        const response = await fetch(`${config.baseUrl}/api/alert-banner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const responseData = await response.json();
        setAlertBanner(responseData);
        setLastUpdated(prev => ({ ...prev, alertBanner: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('Error updating alert banner:', error);
    }
  };

  // Update featured event
  const updateFeaturedEvent = async (id: string, data: Partial<FeaturedEvent>) => {
    try {
      const response = await fetch(`${config.baseUrl}/api/featured-events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const responseData = await response.json();
      setFeaturedEvents(prev => 
        prev.map(event => event.id === id ? responseData : event)
      );
      setLastUpdated(prev => ({ ...prev, featuredEvents: new Date().toISOString() }));
    } catch (error) {
      console.error('Error updating featured event:', error);
    }
  };

  // Add featured event
  const addFeaturedEvent = async (data: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`${config.baseUrl}/api/featured-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const responseData = await response.json();
      setFeaturedEvents(prev => [...prev, responseData]);
      setLastUpdated(prev => ({ ...prev, featuredEvents: new Date().toISOString() }));
    } catch (error) {
      console.error('Error adding featured event:', error);
    }
  };

  // Remove featured event
  const removeFeaturedEvent = async (id: string) => {
    try {
      const response = await fetch(`${config.baseUrl}/api/featured-events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      setFeaturedEvents(prev => prev.filter(event => event.id !== id));
      setLastUpdated(prev => ({ ...prev, featuredEvents: new Date().toISOString() }));
    } catch (error) {
      console.error('Error removing featured event:', error);
    }
  };

  // Dismiss alert banner (client-side only)
  const dismissAlertBanner = () => {
    setAlertBannerDismissed(true);
  };

  // Update YouTube settings
  const updateYoutubeSettings = async (settings: Partial<YouTubeSettings>) => {
    try {
      const updatedSettings = { ...youtubeSettings, ...settings };
      const response = await fetch(`${config.baseUrl}/api/youtube-settings/1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const responseData = await response.json();
      setYoutubeSettings(responseData);
      setLastUpdated(prev => ({ ...prev, youtubeSettings: new Date().toISOString() }));
      return responseData;
    } catch (error) {
      console.error('Error updating YouTube settings:', error);
      throw error;
    }
  };

  // Update video settings
  const updateVideoSettings = async (settings: AdminVideoSettings) => {
    try {
      const updatedSettings = { ...videoSettings, ...settings };
      const response = await fetch(`${config.baseUrl}/api/video-settings/1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const responseData = await response.json();
      setVideoSettings(responseData);
      setLastUpdated(prev => ({ ...prev, videoSettings: new Date().toISOString() }));
      return responseData;
    } catch (error) {
      console.error('Error updating video settings:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        featureFlags,
        alertBanner,
        featuredEvents,
        updateFeatureFlag,
        updateAlertBanner,
        updateFeaturedEvent,
        addFeaturedEvent,
        removeFeaturedEvent,
        dismissAlertBanner,
        alertBannerDismissed,
        isLoading,
        youtubeSettings,
        updateYoutubeSettings,
        videoSettings,
        updateVideoSettings,
        lastUpdated,
        refreshData: fetchData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};