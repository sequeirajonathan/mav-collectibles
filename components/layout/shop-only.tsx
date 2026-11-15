"use client";

import { useShopMode } from "./shop-mode";

/** Shows its children only to people who can see the shop (everyone when it's public; admins and staff when it's hidden). */
export function ShopOnly({ children }: { children: React.ReactNode }) {
  return useShopMode().visible ? <>{children}</> : null;
}
