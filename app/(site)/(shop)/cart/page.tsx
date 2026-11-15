"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@contexts/CartContext";
import { useShopMode } from "@components/layout/shop-mode";
import { formatMoneyCents } from "@lib/format";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";
import { buttonVariants } from "@components/ui/button";

export default function CartPage() {
  const { canPurchase } = useShopMode();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (!canPurchase) {
    return (
      <EmptyState
        title="Online ordering is coming soon"
        description="For now, everything you see in the shop is available in store. Come visit or give us a call."
        action={<Link href="/shop" className="font-semibold text-gold">Browse the shelves →</Link>}
      />
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Your cart" />
        <EmptyState mascot="sylveon" title="Your cart is empty" action={<Link href="/shop" className="font-semibold text-gold">Start browsing →</Link>} />
      </>
    );
  }

  const qtyButton = buttonVariants({ variant: "outline", size: "icon" });
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Your cart" />
      <ul className={cardVariants({ variant: "list" })}>
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 p-3 fold:p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-panel-2">
              {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-contain p-1" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
                <p className="shrink-0 font-bold text-gold">{formatMoneyCents(item.price * item.quantity)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className={qtyButton} onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Remove one ${item.name}`}>
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center tabular-nums" aria-live="polite">{item.quantity}</span>
                <button type="button" className={qtyButton} onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Add one ${item.name}`}>
                  <Plus className="size-4" />
                </button>
                <button type="button" className={cn(qtyButton, "ml-auto text-muted-foreground hover:text-danger")} onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className={cn(cardVariants({ padding: "md" }), "mt-4 flex flex-col gap-3 fold:flex-row fold:items-center fold:justify-between")}>
        <p className="text-lg">
          Subtotal <span className="font-extrabold text-gold">{formatMoneyCents(totalPrice)}</span>
        </p>
        <p className="text-sm text-muted-foreground">Checkout is being built. Taxes and pickup options will show here.</p>
      </div>
    </div>
  );
}
