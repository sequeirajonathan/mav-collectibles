"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

/** Click-to-play YouTube facade: the heavy player loads only when someone presses play. */
export function YouTubeEmbed({ videoId, title, playlistId }: { videoId: string; title: string; playlistId?: string }) {
  const [playing, setPlaying] = useState(false);
  const params = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1" });
  if (playlistId) params.set("list", playlistId);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-panel">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label={`Play video: ${title}`}>
          <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" fill sizes="(min-width: 1024px) 800px, 100vw" className="object-cover opacity-80 transition-opacity group-hover:opacity-100" />
          <span className="absolute left-1/2 top-1/2 inline-flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-ink shadow-xl transition-transform group-hover:scale-110">
            <Play className="size-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
