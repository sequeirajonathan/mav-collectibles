"use client";

import React, { createContext, useContext, useState } from "react";
import { useFeatureFlags, useUpdateFeatureFlag } from "@hooks/useFeatureFlag";
import { useAlertBanner, useUpdateAlertBanner } from "@hooks/useAlertBanner";
import { useFeaturedEvents } from "@hooks/useFeaturedEvents";
import { useVideoSettings, useUpdateVideoSettings } from "@hooks/useVideoSettings";
import { useCreateFeaturedEvent, useUpdateFeaturedEvent, useDeleteFeaturedEvent } from "@hooks/useFeaturedEvents";

import {
  FeatureFlag,
  VideoSettings,
  FeaturedEvent,
  AlertBanner,
} from "@interfaces";

interface AppContextType {
  featureFlags: FeatureFlag[] | undefined;
  alertBanner: AlertBanner | null | undefined;
  featuredEvents: FeaturedEvent[] | undefined;
  dismissAlertBanner: () => void;
  videoSettings: VideoSettings | undefined;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateAlertBanner: (data: Partial<AlertBanner>) => Promise<void>;
  getFeatureFlag: (name: string) => boolean;
  addFeaturedEvent: (event: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFeaturedEvent: (id: string, event: Partial<FeaturedEvent>) => Promise<void>;
  removeFeaturedEvent: (id: string) => Promise<void>;
  updateFeatureFlag: (name: string, enabled: boolean) => Promise<void>;
  lastUpdated: {
    videoSettings?: Date;
  };
  updateVideoSettings: (settings: Partial<VideoSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: featureFlags, isLoading: featureFlagsLoading, refresh: refreshFeatureFlags } =
    useFeatureFlags();
  const { alertBanner, isLoading: alertBannerLoading, refresh: refreshAlertBanner } = useAlertBanner();
  const updateAlertBannerMutation = useUpdateAlertBanner();
  const { data: featuredEvents, isLoading: featuredEventsLoading, refresh: refreshFeaturedEvents } =
    useFeaturedEvents();
  const { mutate: createFeaturedEvent } = useCreateFeaturedEvent();
  const { mutate: updateFeaturedEventMutation } = useUpdateFeaturedEvent();
  const { mutate: deleteFeaturedEvent } = useDeleteFeaturedEvent();
  const { data: videoSettings, isLoading: videoSettingsLoading, refresh: refreshVideoSettings } =
    useVideoSettings();
  const { mutate: updateFeatureFlagMutation } = useUpdateFeatureFlag();
  const { mutate: updateVideoSettingsMutation } = useUpdateVideoSettings();

  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<AppContextType['lastUpdated']>({});

  const dismissAlertBanner = () => {
    setAlertBannerDismissed(true);
  };

  const refreshData = async () => {
    await Promise.all([
      refreshFeatureFlags(),
      refreshAlertBanner(),
      refreshFeaturedEvents(),
      refreshVideoSettings()
    ]);
    setLastUpdated({
      videoSettings: new Date()
    });
  };

  const isLoading =
    featureFlagsLoading ||
    alertBannerLoading ||
    featuredEventsLoading ||
    videoSettingsLoading;

  const updateAlertBanner = async (data: Partial<AlertBanner>) => {
    if (!alertBanner?.id) return;
    await updateAlertBannerMutation(alertBanner.id, data);
  };

  const getFeatureFlag = (name: string): boolean => {
    const flags: FeatureFlag[] = Array.isArray(featureFlags)
      ? featureFlags
      : (featureFlags && (featureFlags as { data?: FeatureFlag[] })?.data) ?? [];

    return flags.find(flag => flag.name === name)?.enabled ?? false;
  };

  const addFeaturedEvent = async (event: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createFeaturedEvent(event);
      // Show success toast
      if (typeof window !== 'undefined') {
        const { toast } = await import('react-hot-toast');
        toast.success('Featured event created successfully!');
      }
    } catch (error) {
      console.error('Error creating featured event:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('react-hot-toast');
        toast.error('Failed to create featured event.');
      }
      throw error;
    }
  };

  const updateFeaturedEvent = async (id: string, event: Partial<FeaturedEvent>) => {
    await updateFeaturedEventMutation({ id, data: event });
  };

  const removeFeaturedEvent = async (id: string) => {
    await deleteFeaturedEvent(id);
  };

  const updateFeatureFlag = async (name: string, enabled: boolean) => {
    const flag = featureFlags?.find(f => f.name === name);
    if (flag) {
      await updateFeatureFlagMutation({ id: flag.id, enabled });
    }
  };

  const updateVideoSettings = async (settings: Partial<VideoSettings>) => {
    await updateVideoSettingsMutation(settings);
  };

  return (
    <AppContext.Provider
      value={{
        featureFlags,
        alertBanner: alertBannerDismissed ? null : alertBanner,
        featuredEvents,
        dismissAlertBanner,
        videoSettings,
        isLoading,
        refreshData,
        updateAlertBanner,
        getFeatureFlag,
        addFeaturedEvent,
        updateFeaturedEvent,
        removeFeaturedEvent,
        updateFeatureFlag,
        lastUpdated,
        updateVideoSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
