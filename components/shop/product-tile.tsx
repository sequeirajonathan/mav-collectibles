import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@utils";

/**
 * The one way product photos are shown: a fixed-shape spotlight tile with the
 * photo fitted inside and a soft shadow under it. Works for cut-outs, card
 * scans and unprocessed originals alike, so every grid lines up.
 */
export function ProductTile({
  src,
  alt = "",
  sizes,
  priority = false,
  className,
  imageClassName,
}: {
  src: string | undefined;
  alt?: string;
  sizes: string;
  priority?: boolean;
  /** Set the shape here (e.g. "aspect-[4/5]"). */
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("bg-spotlight relative overflow-hidden", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn("object-contain p-[9%] drop-shadow-[0_10px_14px_var(--tile-shadow)]", imageClassName)}
        />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
          <ImageOff aria-hidden className="size-6 opacity-60" />
          Photo coming soon
        </span>
      )}
    </div>
  );
}
