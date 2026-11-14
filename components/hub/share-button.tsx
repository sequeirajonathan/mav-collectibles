"use client";

import { Share2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";

/** Uses the native share sheet on phones; copies the link elsewhere. */
export function ShareButton({ title, path, className }: { title: string; path: string; className?: string }) {
  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // The user closed the share sheet.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };
  return (
    <Button variant="ghost" size="sm" onClick={share} className={className} aria-label={`Share ${title}`}>
      <Share2 />
      Share
    </Button>
  );
}
