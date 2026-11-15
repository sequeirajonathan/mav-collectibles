"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import type { CatalogItem } from "@lib/contracts/catalog";
import { useCart } from "@contexts/CartContext";
import { useShopMode } from "@components/layout/shop-mode";
import { formatMoneyCents } from "@lib/format";
import { cn } from "@utils";
import { Card, cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { buttonVariants } from "@components/ui/button";
import { ProductTile } from "./product-tile";
import { tidyProductName } from "@lib/catalog/display";

export function ProductCard({ item, priority = false }: { item: CatalogItem; priority?: boolean }) {
  const { canPurchase } = useShopMode();
  const { addItem } = useCart();
  const image = item.imageUrls?.[0];
  const name = tidyProductName(item.name);
  const lowStock = !item.soldOut && item.inventoryCount !== undefined && item.inventoryCount > 0 && item.inventoryCount <= 3;
  return (
    <article className={cn(cardVariants({ variant: "interactive" }), "group relative flex flex-col overflow-hidden")}>
      <Link href={`/product/${item.itemId}`} tabIndex={-1} aria-hidden className="relative block">
        <ProductTile
          src={image}
          priority={priority}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 576px) 33vw, 50vw"
          className={cn("aspect-[4/5]", item.soldOut && "opacity-60 grayscale-[35%]")}
          imageClassName="transition-transform duration-300 can-hover:group-hover:scale-[1.04]"
        />
        {item.soldOut && (
          <span className="absolute left-2 top-2 rounded-full border border-line bg-scrim px-2 py-0.5 text-xs font-bold text-danger">Sold out</span>
        )}
        {lowStock && (
          <span className="absolute left-2 top-2 rounded-full border border-line bg-scrim px-2 py-0.5 text-xs font-bold text-gold">Only {item.inventoryCount} left</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-3">
        {item.categoryName && (
          <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">{tidyProductName(item.categoryName)}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={`/product/${item.itemId}`} className="after:absolute after:inset-0 hover:text-gold-light">{name}</Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-base font-extrabold text-gold">{formatMoneyCents(item.priceAmount, item.priceCurrency)}</span>
          {canPurchase ? (
            <button
              type="button"
              disabled={item.soldOut}
              onClick={() => {
                addItem({ id: item.variationId, name, price: item.priceAmount, imageUrl: image });
                toast.success("Added to cart");
              }}
              className={cn(buttonVariants({ variant: "gold", size: "icon" }), "relative z-10")}
              aria-label={`Add ${name} to cart`}
            >
              <Plus className="size-5" />
            </button>
          ) : (
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", item.soldOut ? "text-muted-foreground" : "text-success")}>
              {!item.soldOut && <span aria-hidden className="size-1.5 rounded-full bg-success" />}
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
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/5] rounded-none bg-panel-2" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 rounded bg-panel-2" />
            <Skeleton className="h-3 w-1/2 rounded bg-panel-2" />
          </div>
        </Card>
      ))}
    </div>
  );
}
