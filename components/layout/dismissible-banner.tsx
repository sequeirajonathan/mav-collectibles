"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "mav:dismissed-banner";

export function DismissibleBanner({
  id,
  backgroundColor,
  textColor,
  children,
}: {
  id: string;
  backgroundColor: string;
  textColor: string;
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after hydration
      setHidden(localStorage.getItem(KEY) === id);
    } catch {
      // Storage unavailable (private mode): keep showing it.
    }
  }, [id]);
  if (hidden) return null;
  return (
    <div role="region" aria-label="Announcement" className="relative px-safe py-2 text-center text-sm font-medium" style={{ backgroundColor, color: textColor }}>
      <p className="mx-auto max-w-5xl px-8">{children}</p>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(KEY, id);
          } catch {
            // ignore
          }
        }}
        className="absolute right-[max(0.25rem,env(safe-area-inset-right))] top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md hover:bg-black/10"
        aria-label="Dismiss announcement"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
