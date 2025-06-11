"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '@contexts/AppContext';
import { useResource } from '@lib/swr';

interface AlertBannerData {
  message: string;
  code?: string;
  backgroundColor?: string;
  textColor?: string;
  enabled: boolean;
}

interface AlertBannerProps {
  initialData?: AlertBannerData;
}

export default function AlertBanner({ initialData }: AlertBannerProps) {
  const { getFeatureFlag } = useAppContext();
  const {
    data: alertBanner,
    isLoading: alertBannerLoading,
    error: _error,
  } = useAlertBannerWithFallback(initialData);
  const [isVisible, setIsVisible] = useState(true);
  const showAlertBanner = getFeatureFlag('showAlertBanner');
  const isMaintenanceMode = getFeatureFlag('maintenanceMode');

  useEffect(() => {
    if (alertBanner) {
      setIsVisible(true);
    }
  }, [alertBanner]);

  // Always render the placeholder to prevent layout shift
  if (!showAlertBanner || !alertBanner || isMaintenanceMode || alertBannerLoading) {
    return <div className="h-[48px]" />;
  }

  if (!isVisible || !alertBanner.enabled) return null;

  return (
    <div
      className={`w-full left-0 right-0 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        backgroundColor: alertBanner.backgroundColor || '#E6B325',
        color: alertBanner.textColor || '#000000',
        height: '48px',
      }}
    >
      <div className="relative flex items-center justify-center px-4 py-2 text-center h-full">
        <p className="text-sm font-medium pr-6 sm:pr-0">
          {alertBanner.message}
          {alertBanner.code && (
            <span className="ml-2 font-bold">{alertBanner.code}</span>
          )}
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 rounded-full hover:bg-black/10 transition-colors hidden sm:block"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Custom hook to inject fallbackData into SWR
function useAlertBannerWithFallback(fallbackData?: AlertBannerData) {
  return useResource('/alert-banner', {
    onError: (error) => {
      console.error('Alert banner operation failed:', error);
    },
    fallbackData,
  });
}
