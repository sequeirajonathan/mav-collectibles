"use client";

import React, { createContext, useContext, useState } from "react";
import { useFeatureFlags, useUpdateFeatureFlag } from "@hooks/useFeatureFlag";
import { useAlertBanner, useUpdateAlertBanner } from "@hooks/useAlertBanner";
import { useFeaturedEvents } from "@hooks/useFeaturedEvents";
import { useYoutubeSettings, useUpdateYoutubeSettings } from "@hooks/useYoutubeSettings";
import { useVideoSettings, useUpdateVideoSettings } from "@hooks/useVideoSettings";
import { useCreateFeaturedEvent, useUpdateFeaturedEvent, useDeleteFeaturedEvent } from "@hooks/useFeaturedEvents";

import {
  FeatureFlag,
  VideoSettings,
  YouTubeSettings,
  FeaturedEvent,
  AlertBanner,
} from "@interfaces";

interface AppContextType {
  featureFlags: FeatureFlag[] | undefined;
  alertBanner: AlertBanner | null | undefined;
  featuredEvents: FeaturedEvent[] | undefined;
  dismissAlertBanner: () => void;
  youtubeSettings: YouTubeSettings | undefined;
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
    youtubeSettings?: Date;
    videoSettings?: Date;
  };
  updateVideoSettings: (settings: Partial<VideoSettings>) => Promise<void>;
  updateYoutubeSettings: (settings: Partial<YouTubeSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: featureFlags, isLoading: featureFlagsLoading, refetch: refetchFeatureFlags } =
    useFeatureFlags();
  const { data: alertBanner, isLoading: alertBannerLoading, refetch: refetchAlertBanner } = useAlertBanner();
  const { mutateAsync: updateAlertBannerMutation } = useUpdateAlertBanner();
  const { data: featuredEvents, isLoading: featuredEventsLoading, refetch: refetchFeaturedEvents } =
    useFeaturedEvents();
  const { mutateAsync: createFeaturedEvent } = useCreateFeaturedEvent();
  const { mutateAsync: updateFeaturedEventMutation } = useUpdateFeaturedEvent();
  const { mutateAsync: deleteFeaturedEvent } = useDeleteFeaturedEvent();
  const { data: youtubeSettings, isLoading: youtubeSettingsLoading, refetch: refetchYoutubeSettings } =
    useYoutubeSettings();
  const { mutateAsync: updateYoutubeSettingsMutation } = useUpdateYoutubeSettings();
  const { data: videoSettings, isLoading: videoSettingsLoading, refetch: refetchVideoSettings } =
    useVideoSettings();
  const { mutateAsync: updateFeatureFlagMutation } = useUpdateFeatureFlag();
  const { mutateAsync: updateVideoSettingsMutation } = useUpdateVideoSettings();

  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<AppContextType['lastUpdated']>({});

  const dismissAlertBanner = () => {
    setAlertBannerDismissed(true);
  };

  const refreshData = async () => {
    await Promise.all([
      refetchFeatureFlags(),
      refetchAlertBanner(),
      refetchFeaturedEvents(),
      refetchYoutubeSettings(),
      refetchVideoSettings()
    ]);
    setLastUpdated({
      youtubeSettings: new Date(),
      videoSettings: new Date()
    });
  };

  const isLoading =
    featureFlagsLoading ||
    alertBannerLoading ||
    featuredEventsLoading ||
    youtubeSettingsLoading ||
    videoSettingsLoading;

  const updateAlertBanner = async (data: Partial<AlertBanner>) => {
    if (!alertBanner?.id) return;
    await updateAlertBannerMutation({ id: alertBanner.id, data });
  };

  const getFeatureFlag = (name: string) => {
    return featureFlags?.find(flag => flag.name === name)?.enabled ?? false;
  };

  const addFeaturedEvent = async (event: Omit<FeaturedEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createFeaturedEvent(event);
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

  const updateYoutubeSettings = async (settings: Partial<YouTubeSettings>) => {
    await updateYoutubeSettingsMutation(settings);
  };

  return (
    <AppContext.Provider
      value={{
        featureFlags,
        alertBanner: alertBannerDismissed ? null : alertBanner,
        featuredEvents,
        dismissAlertBanner,
        youtubeSettings,
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
        updateYoutubeSettings,
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
