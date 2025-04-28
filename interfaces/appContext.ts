// types/appContext.ts

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

export interface FeatureFlags {
  showAlertBanner: boolean;
  showFeaturedEvents: boolean;
  showYouTubeVideo: boolean;
  showVideoPlayer: boolean;
  showDirectStreaming: boolean;
}

export interface LastUpdated {
  featureFlags?: string;
  alertBanner?: string;
  featuredEvents?: string;
  youtubeSettings?: string;
  videoSettings?: string;
}
