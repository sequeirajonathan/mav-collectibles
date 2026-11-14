"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import type { CatalogItem } from "@lib/contracts/catalog";
import { useCart } from "@contexts/CartContext";
import { useShopMode } from "@components/layout/shop-mode";
import { formatMoneyCents } from "@lib/format";
import { cn } from "@utils";

export function ProductCard({ item, priority = false }: { item: CatalogItem; priority?: boolean }) {
  const { canPurchase } = useShopMode();
  const { addItem } = useCart();
  const image = item.imageUrls?.[0];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-panel">
      <Link href={`/product/${item.itemId}`} className="relative block aspect-square bg-panel-2">
        {image ? (
          <Image src={image} alt="" fill priority={priority} sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw" className="object-contain p-2 transition-transform can-hover:group-hover:scale-105" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No image</span>
        )}
        {item.soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-xs font-bold text-danger">Sold out</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={`/product/${item.itemId}`} className="hover:text-gold-light">{item.name}</Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-bold text-gold">{formatMoneyCents(item.priceAmount, item.priceCurrency)}</span>
          {canPurchase ? (
            <button
              type="button"
              disabled={item.soldOut}
              onClick={() => {
                addItem({ id: item.variationId, name: item.name, price: item.priceAmount, imageUrl: image });
                toast.success("Added to cart");
              }}
              className="inline-flex size-10 items-center justify-center rounded-md bg-gold text-ink hover:bg-gold-light disabled:opacity-40"
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus className="size-5" />
            </button>
          ) : (
            <span className={cn("text-xs font-medium", item.soldOut ? "text-muted-foreground" : "text-success")}>
              {item.soldOut ? "Ask in store" : "In store"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 fold:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-line bg-panel">
          <div className="aspect-square bg-panel-2" />
          <div className="space-y-2 p-3">
            <div className="h-3 rounded bg-panel-2" />
            <div className="h-3 w-1/2 rounded bg-panel-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
