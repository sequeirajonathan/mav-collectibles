"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { cn } from "@utils";

/** Chrome/Edge/Android fire this when the site can be installed. Not in the DOM typings yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noop = () => () => undefined;
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
// iPhone/iPad (iPadOS reports as a Mac with touch). Only Safari can add to the Home Screen.
const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Registers the service worker (production only: it would cache stale dev builds). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}

/**
 * "Install app" entry. On Android and desktop it opens the browser's install
 * prompt; on iPhone and iPad, which have no prompt, it shows the two taps to
 * add the site to the Home Screen. Renders nothing once installed or where
 * installing isn't possible.
 */
export function InstallApp({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const installed = useSyncExternalStore(noop, isStandalone, () => true);
  const ios = useSyncExternalStore(noop, isIos, () => false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  const install = async () => {
    if (!prompt) return void setShowIosHelp((open) => !open);
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void install()}
        aria-expanded={prompt ? undefined : showIosHelp}
        className="inline-flex min-h-11 w-full items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:bg-panel-2"
      >
        <Download aria-hidden className="size-5 text-gold" />
        Install the MAV app
      </button>
      {showIosHelp && (
        <div role="status" className={cn("relative mt-2 rounded-lg border border-line bg-panel-2 p-3 pr-10 text-sm")}>
          <button type="button" onClick={() => setShowIosHelp(false)} aria-label="Close" className="absolute right-1 top-1 inline-flex size-9 items-center justify-center rounded-md hover:bg-panel">
            <X aria-hidden className="size-4" />
          </button>
          <ol className="space-y-2">
            <li className="flex items-center gap-2">
              <Share aria-hidden className="size-4 shrink-0 text-gold" />
              <span>In Safari, tap <strong>Share</strong>.</span>
            </li>
            <li className="flex items-center gap-2">
              <SquarePlus aria-hidden className="size-4 shrink-0 text-gold" />
              <span>Choose <strong>Add to Home Screen</strong>.</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
