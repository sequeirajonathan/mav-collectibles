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
  
  // Merge the VideoSettings interface into the same global declaration
  interface VideoSettings {
    url: string;
    enabled: boolean;
    autoplay: boolean;
  }
}

export {}; // This makes the file a module 