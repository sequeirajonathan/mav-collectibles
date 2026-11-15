"use client";

import { useState } from "react";
import { cn } from "@utils";
import { cardVariants } from "@components/ui/card";
import { ProductTile } from "./product-tile";

/** Main product photo with tappable thumbnails. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  return (
    <div>
      <ProductTile
        src={current}
        alt={name}
        priority
        sizes="(min-width: 768px) 45vw, 100vw"
        className={cn(cardVariants(), "aspect-square short:aspect-[16/10]")}
        imageClassName="p-[7%]"
      />
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.slice(0, 8).map((url, i) => (
            <li key={url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1} of ${Math.min(images.length, 8)}`}
                aria-pressed={i === index}
                className={cn("block overflow-hidden rounded-lg border-2", i === index ? "border-gold" : "border-line can-hover:hover:border-gold/50")}
              >
                <ProductTile src={url} sizes="72px" className="size-[4.5rem]" imageClassName="p-1.5 drop-shadow-none" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
