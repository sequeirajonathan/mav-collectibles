export interface VideoSettings {
  src: string;
  type: string;
  isLive: boolean;
  poster: string;
  title: string;
  autoplay: boolean;
  muted: boolean;
  twitchChannel?: string;
}

export interface AdminVideoSettings {
  url: string;
  autoplay: boolean;
} 