"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@utils";
import { THEME_STORAGE_KEY, type Theme } from "./theme";

const listeners = new Set<() => void>();
const current = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setTheme(theme: Theme) {
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing: the choice just won't be remembered.
  }
  for (const listener of listeners) listener();
}

/** Light/dark switch. The choice is saved on this device. */
export function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  // The server always renders the light default; the saved choice applies on the client.
  const theme = useSyncExternalStore(subscribe, current, (): Theme => "light");
  const next: Theme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-foreground/80 hover:bg-panel-2 hover:text-foreground",
        withLabel ? "px-3 text-sm font-semibold" : "size-11",
        className
      )}
    >
      <Icon aria-hidden className="size-5" />
      {withLabel && <span>{next === "dark" ? "Dark theme" : "Light theme"}</span>}
    </button>
  );
}
