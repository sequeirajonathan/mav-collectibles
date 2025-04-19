"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { config } from '@/lib/config';

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
}

interface YouTubeSettings {
  videoId: string;
  title: string;
  autoplay: boolean;
  muted: boolean;
  playlistId?: string;
}

interface AppContextType {
  featureFlags: FeatureFlags;
  alertBanner: AlertBanner | null;
  featuredEvents: FeaturedEvent[];
  updateFeatureFlag: (name: string, enabled: boolean) => Promise<void>;
  updateAlertBanner: (data: Partial<AlertBanner>) => Promise<void>;
  updateFeaturedEvent: (id: string, data: Partial<FeaturedEvent>) => Promise<void>;
  addFeaturedEvent: (data: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeFeaturedEvent: (id: string) => Promise<void>;
  dismissAlertBanner: () => void;
  alertBannerDismissed: boolean;
  isLoading: boolean;
  youtubeSettings: YouTubeSettings;
  updateYoutubeSettings: (settings: Partial<YouTubeSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    showAlertBanner: false,
    showFeaturedEvents: false,
    showYouTubeVideo: false,
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
    playlistId: ''
  });

  // Load data on initial render
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch feature flags
        const flagsResponse = await fetch(`${config.baseUrl}/api/feature-flags`);
        if (!flagsResponse.ok) throw new Error(`HTTP error! Status: ${flagsResponse.status}`);
        const flagsData = await flagsResponse.json();
        console.log('Feature flags response:', flagsData);
        
        const flags: Record<string, boolean> = {};
        flagsData.forEach((flag: FeatureFlag) => {
          flags[flag.name] = flag.enabled;
        });
        setFeatureFlags(prev => ({ ...prev, ...flags }));
        
        // Fetch alert banner
        const alertResponse = await fetch(`${config.baseUrl}/api/alert-banner`);
        if (alertResponse.ok) {
          const alertData = await alertResponse.json();
          if (alertData && alertData.enabled) {
            setAlertBanner(alertData);
          }
        }
        
        // Fetch featured events
        const eventsResponse = await fetch(`${config.baseUrl}/api/featured-events`);
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setFeaturedEvents(eventsData.filter((event: FeaturedEvent) => event.enabled)
            .sort((a: FeaturedEvent, b: FeaturedEvent) => a.order - b.order));
        }
        
        // Fetch YouTube settings
        const youtubeResponse = await fetch(`${config.baseUrl}/api/youtube-settings`);
        if (youtubeResponse.ok) {
          const youtubeData = await youtubeResponse.json();
          if (youtubeData) {
            setYoutubeSettings(youtubeData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Update feature flag
  const updateFeatureFlag = async (name: string, enabled: boolean) => {
    try {
      // Find the flag ID by name
      const flagsResponse = await fetch(`${config.baseUrl}/api/feature-flags`);
      if (!flagsResponse.ok) throw new Error(`HTTP error! Status: ${flagsResponse.status}`);
      const flagsData = await flagsResponse.json();
      const flag = flagsData.find((f: FeatureFlag) => f.name === name);
      
      if (flag) {
        const updateResponse = await fetch(`${config.baseUrl}/api/feature-flags/${flag.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        });
        
        if (!updateResponse.ok) throw new Error(`HTTP error! Status: ${updateResponse.status}`);
        setFeatureFlags(prev => ({ ...prev, [name]: enabled }));
      }
    } catch (error) {
      console.error('Error updating feature flag:', error);
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
      return responseData;
    } catch (error) {
      console.error('Error updating YouTube settings:', error);
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
        updateYoutubeSettings
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