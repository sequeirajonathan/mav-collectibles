"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '@/lib/axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
        
        // Use absolute URLs
        const flagsResponse = await axios.get(`${API_URL}/feature-flags`);
        console.log('Feature flags response:', flagsResponse);
        
        const flags: Record<string, boolean> = {};
        flagsResponse.data.forEach((flag: FeatureFlag) => {
          flags[flag.name] = flag.enabled;
        });
        setFeatureFlags(prev => ({ ...prev, ...flags }));
        
        // Update other API calls similarly
        const alertResponse = await axios.get(`${API_URL}/alert-banner`);
        if (alertResponse.data && alertResponse.data.enabled) {
          setAlertBanner(alertResponse.data);
        }
        
        const eventsResponse = await axios.get(`${API_URL}/featured-events`);
        setFeaturedEvents(eventsResponse.data.filter((event: FeaturedEvent) => event.enabled)
          .sort((a: FeaturedEvent, b: FeaturedEvent) => a.order - b.order));
        
        // Add YouTube settings API call
        const youtubeResponse = await axios.get(`${API_URL}/youtube-settings`);
        if (youtubeResponse.data) {
          setYoutubeSettings(youtubeResponse.data);
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
      const flagsResponse = await axios.get(`${API_URL}/feature-flags`);
      const flag = flagsResponse.data.find((f: FeatureFlag) => f.name === name);
      
      if (flag) {
        await axios.patch(`${API_URL}/feature-flags/${flag.id}`, { enabled });
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
        const response = await axios.patch(`${API_URL}/alert-banner/${alertBanner.id}`, data);
        setAlertBanner(response.data);
      } else {
        const response = await axios.post(`${API_URL}/alert-banner`, data);
        setAlertBanner(response.data);
      }
    } catch (error) {
      console.error('Error updating alert banner:', error);
    }
  };

  // Update featured event
  const updateFeaturedEvent = async (id: string, data: Partial<FeaturedEvent>) => {
    try {
      const response = await axios.patch(`${API_URL}/featured-events/${id}`, data);
      setFeaturedEvents(prev => 
        prev.map(event => event.id === id ? response.data : event)
      );
    } catch (error) {
      console.error('Error updating featured event:', error);
    }
  };

  // Add featured event
  const addFeaturedEvent = async (data: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await axios.post(`${API_URL}/featured-events`, data);
      setFeaturedEvents(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding featured event:', error);
    }
  };

  // Remove featured event
  const removeFeaturedEvent = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/featured-events/${id}`);
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
      const response = await axios.put(`${API_URL}/youtube-settings/1`, updatedSettings);
      setYoutubeSettings(response.data);
      return response.data;
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

export const YouTubeSettingsProvider = ({ children }) => {
  // YouTube settings logic only
};

export const FeatureFlagsProvider = ({ children }) => {
  // Feature flags logic only
}; 