import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { STORE_ADDRESS } from "@lib/format";

export const metadata: Metadata = { title: "You're offline", robots: { index: false } };

/** Shown by the service worker (public/sw.js) when a page can't be loaded. */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <WifiOff aria-hidden className="size-10 text-gold" />
      <h1 className="mt-4 text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn&apos;t reach MAV Collectibles. Check your connection and try again.
      </p>
      <a href="" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-cta px-5 text-sm font-bold text-cta-ink">
        Try again
      </a>
      <p className="mt-8 text-sm text-muted-foreground">
        Visit us at {STORE_ADDRESS} · <a className="text-gold" href="tel:9363303553">(936) 330-3553</a>
      </p>
    </div>
  );
}
