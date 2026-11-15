"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoSettings } from "@lib/contracts/site";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

/** HLS live stream. video.js (~250 KB) is loaded only when this component mounts. */
export function LiveStream({ settings }: { settings: VideoSettings }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let dispose: (() => void) | undefined;
    void (async () => {
      const [{ default: videojs }] = await Promise.all([import("video.js"), import("@videojs/http-streaming"), import("video.js/dist/video-js.css")]);
      if (disposed || !container.current) return;
      const el = document.createElement("video-js");
      el.className = "vjs-big-play-centered vjs-fluid";
      container.current.appendChild(el);
      const player = videojs(el, {
        controls: true,
        autoplay: settings.autoplay ? "muted" : false,
        muted: settings.muted,
        poster: settings.poster || undefined,
        liveui: settings.isLive,
        playsinline: true,
        sources: [{ src: settings.src, type: settings.type }],
      });
      player.on("error", () => setError("The stream isn't available right now."));
      dispose = () => player.dispose();
    })();
    return () => {
      disposed = true;
      dispose?.();
    };
  }, [settings]);

  return (
    <div className={cn(cardVariants(), "overflow-hidden")}>
      <div ref={container} />
      {error && <p className="px-4 py-3 text-sm text-muted-foreground">{error}</p>}
    </div>
  );
}
