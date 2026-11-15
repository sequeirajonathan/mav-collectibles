"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { useCart } from "@contexts/CartContext";
import { useShopMode } from "@components/layout/shop-mode";
import type { Product } from "@lib/contracts/catalog";
import { formatMoneyCents } from "@lib/format";
import { cn } from "@utils";
import { cardVariants } from "@components/ui/card";

export function ProductPurchase({ product }: { product: Product }) {
  const { canPurchase } = useShopMode();
  const { addItem } = useCart();
  const firstAvailable = product.variations.find((v) => !v.soldOut) ?? product.variations[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const selected = product.variations.find((v) => v.id === selectedId) ?? firstAvailable;
  if (!selected) return null;

  return (
    <div className="space-y-4">
      <p className="text-3xl font-extrabold text-gold">{formatMoneyCents(selected.priceAmount, selected.priceCurrency)}</p>
      {product.variations.length > 1 && (
        <fieldset>
          <legend className="text-sm font-semibold">Option</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variations.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                aria-pressed={v.id === selected.id}
                className={cn(
                  "min-h-10 rounded-lg border px-3 text-sm font-medium",
                  v.id === selected.id ? "border-gold bg-gold/10 text-foreground" : "border-line text-muted-foreground",
                  v.soldOut && "line-through opacity-60"
                )}
              >
                {v.name || "Standard"}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <p className={cn("text-sm font-medium", selected.soldOut ? "text-danger" : "text-success")}>
        {selected.soldOut
          ? "Sold out"
          : selected.inventoryCount !== undefined && selected.inventoryCount <= 5
            ? `Only ${selected.inventoryCount} left`
            : "In stock"}
      </p>
      {canPurchase ? (
        <div className="flex flex-col gap-2 fold:flex-row">
          <Button
            variant="gold"
            className="w-full fold:w-auto"
            disabled={selected.soldOut}
            onClick={() => {
              addItem({
                id: selected.id,
                name: selected.name ? `${product.name} – ${selected.name}` : product.name,
                price: selected.priceAmount,
                imageUrl: product.imageUrls[0],
              });
              toast.success("Added to cart");
            }}
          >
            Add to cart
          </Button>
          <Button asChild variant="outline" className="w-full fold:w-auto">
            <Link href="/cart">View cart</Link>
          </Button>
        </div>
      ) : (
        <div className={cn(cardVariants({ variant: "accent", padding: "row", radius: "lg" }), "text-sm")}>
          <p className="font-semibold text-foreground">Available in store</p>
          <p className="mt-0.5 text-foreground/80">Stop by MAV Collectibles or give us a call to hold it for you.</p>
          <a href="tel:9364491277" className="mt-2 inline-flex min-h-10 items-center font-semibold text-gold">
            Call (936) 449-1277
          </a>
        </div>
      )}
    </div>
  );
}
