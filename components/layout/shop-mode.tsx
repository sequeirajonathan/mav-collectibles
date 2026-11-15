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
  /** This person can open the shop: it's public, or they're admin/staff previewing it. */
  visible: boolean;
  /** The shop is hidden from customers and this person is seeing it as staff. */
  hiddenPreview: boolean;
  /** The Vendors section is switched on. */
  vendors: boolean;
}

const ShopModeContext = createContext<ShopMode>({ live: false, canPurchase: false, previewing: false, visible: false, hiddenPreview: false, vendors: true });

export function ShopModeProvider({
  live,
  shopVisible,
  vendorsVisible = true,
  children,
}: {
  live: boolean;
  shopVisible: boolean;
  vendorsVisible?: boolean;
  children: React.ReactNode;
}) {
  const { role } = useAuth();
  const staff = role === UserRole.ADMIN || role === UserRole.STAFF;
  const value: ShopMode = {
    live,
    canPurchase: (live && shopVisible) || staff,
    previewing: !live && staff,
    visible: shopVisible || staff,
    hiddenPreview: !shopVisible && staff,
    vendors: vendorsVisible,
  };
  return <ShopModeContext.Provider value={value}>{children}</ShopModeContext.Provider>;
}

export const useShopMode = () => useContext(ShopModeContext);
