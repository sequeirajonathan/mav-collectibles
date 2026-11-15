import Link from "next/link";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@utils";

/** Horizontally scrolling row of chips on phones; wraps from the `fold` breakpoint up. */
export const chipRowClass =
  "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:flex-wrap fold:px-0";

/** Pill-shaped filter/tab. 44px tall on touch screens, 36px with a mouse. */
export function chipClass(active = false) {
  return cn(
    "ui-chip inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors can-hover:min-h-9",
    active
      ? "border-gold bg-gold font-semibold text-ink"
      : "border-line bg-panel text-muted-foreground hover:border-gold/50 hover:text-foreground"
  );
}

/**
 * A chip that links somewhere (filters, game tabs). Sets aria-current when active.
 * `dot` shows a small colour swatch, e.g. a game's brand colour.
 */
export function ChipLink({
  active = false,
  dot,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { active?: boolean; dot?: string }) {
  return (
    <Link aria-current={active ? "page" : undefined} className={cn(chipClass(active), className)} {...props}>
      {dot && <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: dot } satisfies CSSProperties} />}
      {children}
    </Link>
  );
}
