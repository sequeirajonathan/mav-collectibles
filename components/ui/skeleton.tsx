import type { HTMLAttributes } from "react";
import { cn } from "@utils";

/**
 * Loading placeholder with a soft shimmer. Defaults to a panel-sized block;
 * pass `className="h-4 w-1/2 rounded bg-panel-2"` for text lines inside a Card.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton rounded-xl bg-panel", className)} {...props} />;
}
