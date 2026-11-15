"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@contexts/AuthContext";
import { UserRole } from "@interfaces/roles";

interface ShopMode {
  /** The owner has turned on online purchasing. */
  live: boolean;
  /** Cart and checkout are shown: when live, or for admins/staff previewing. */
  canPurchase: boolean;
  /** Staff are seeing purchase UI that customers don't. */
  previewing: boolean;
}

const ShopModeContext = createContext<ShopMode>({ live: false, canPurchase: false, previewing: false });

export function ShopModeProvider({ live, children }: { live: boolean; children: React.ReactNode }) {
  const { role } = useAuth();
  const staff = role === UserRole.ADMIN || role === UserRole.STAFF;
  const value: ShopMode = { live, canPurchase: live || staff, previewing: !live && staff };
  return <ShopModeContext.Provider value={value}>{children}</ShopModeContext.Provider>;
}

export const useShopMode = () => useContext(ShopModeContext);
