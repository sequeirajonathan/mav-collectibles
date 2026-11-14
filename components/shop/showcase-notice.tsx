"use client";

import { Store } from "lucide-react";
import { useShopMode } from "@components/layout/shop-mode";

/** Explains showcase mode to customers, or reminds staff that they're previewing. */
export function ShowcaseNotice() {
  const { live, previewing } = useShopMode();
  if (live) return null;
  return previewing ? (
    <p role="status" className="mb-5 rounded-lg border border-warning/50 bg-warning/10 px-4 py-2.5 text-sm text-warning">
      Staff preview: customers see this shop as an in-store showcase, without the cart. Turn on <strong>shopLive</strong> in Admin → Site when you&apos;re ready to sell online.
    </p>
  ) : (
    <div className="mb-5 flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm">
      <Store className="mt-0.5 size-5 shrink-0 text-gold" />
      <p className="text-foreground/90">
        <strong className="text-foreground">In-store showcase.</strong> Browse what&apos;s on our shelves, then come see us. Online ordering is coming soon.
      </p>
    </div>
  );
}
