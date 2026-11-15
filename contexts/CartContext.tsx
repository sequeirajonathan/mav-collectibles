"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
interface CartItem {
  id: string;
  name: string;
  /** Price in cents. */
  price: number;
  quantity: number;
  imageUrl?: string;
}

/** Validates what's in localStorage (it can be stale or tampered with). */
function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    Number.isInteger(v.price) && (v.price as number) >= 0 &&
    Number.isInteger(v.quantity) && (v.quantity as number) > 0 &&
    (v.imageUrl === undefined || typeof v.imageUrl === "string")
  );
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const STORAGE_KEY = "cart";
const CartContext = createContext<CartContextType | undefined>(undefined);

function readStoredCart(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage after mount
    setItems(readStoredCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable; the cart still works for this visit.
    }
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.id === item.id);
      return existing
        ? current.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i))
        : [...current, { ...item, quantity }];
    });
  }, []);
  const removeItem = useCallback((id: string) => setItems((current) => current.filter((i) => i.id !== id)), []);
  const updateQuantity = useCallback(
    (id: string, quantity: number) =>
      setItems((current) => (quantity < 1 ? current.filter((i) => i.id !== id) : current.map((i) => (i.id === id ? { ...i, quantity } : i)))),
    []
  );
  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    [items, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
