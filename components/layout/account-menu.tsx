"use client";

import { LinkButton } from "@components/ui/link-button";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, ShoppingCart } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useCart } from "@contexts/CartContext";
import { CONTENT_ROLES, UserRole } from "@interfaces/roles";
import { useShopMode } from "./shop-mode";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

export function CartLink() {
  const { canPurchase } = useShopMode();
  const { totalItems } = useCart();
  if (!canPurchase) return null;
  return (
    <Link href="/cart" className="relative inline-flex size-11 items-center justify-center rounded-md hover:bg-panel-2" aria-label={`Cart, ${totalItems} items`}>
      <ShoppingCart className="size-5" />
      {totalItems > 0 && (
        <span className="absolute right-1 top-1 min-w-4 rounded-full bg-gold px-1 text-center text-[0.65rem] font-bold leading-4 text-ink">{totalItems}</span>
      )}
    </Link>
  );
}

export function AccountMenu() {
  const router = useRouter();
  const { user, role, profile, isLoaded, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!isLoaded) return <span className="inline-block size-11" aria-hidden />;
  if (!user) {
    return (
      <LinkButton href="/sign-in" variant="outline" size="sm" className="border-gold/60 text-gold hover:bg-gold hover:text-ink">
        Sign in
      </LinkButton>
    );
  }

  const item = "block rounded-md px-3 py-2.5 text-sm hover:bg-panel-2";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex size-11 items-center justify-center rounded-md hover:bg-panel-2"
        aria-label="Account menu"
      >
        <CircleUserRound className="size-6 text-gold" />
      </button>
      {open && (
        <div role="menu" className={cn(cardVariants(), "absolute right-0 z-50 mt-2 w-60 p-1 shadow-2xl")}>
          <p className="truncate px-3 py-2 text-xs text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{profile?.username ?? user.email}</span>
          </p>
          <Link role="menuitem" href="/dashboard" className={item} onClick={() => setOpen(false)}>My hub</Link>
          <Link role="menuitem" href="/profile" className={item} onClick={() => setOpen(false)}>Profile</Link>
          {role && CONTENT_ROLES.includes(role) && (
            <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>Admin</Link>
          )}
          {role === UserRole.PRINT_AGENT && (
            <Link role="menuitem" href="/print-agent" className={item} onClick={() => setOpen(false)}>Print agent</Link>
          )}
          <button
            role="menuitem"
            type="button"
            className={`${item} w-full text-left text-danger`}
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.replace("/");
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
