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