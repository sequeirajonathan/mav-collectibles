import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@utils";

/**
 * The panel surface used for every boxed thing on the site.
 * Use `asChild` to put the styling on a <Link>, <ul>, <form> or <article>.
 */
const cardVariants = cva("ui-card rounded-xl border bg-panel", {
  variants: {
    variant: {
      default: "border-line",
      /** Clickable cards: gold edge, soft glow and a 2px lift on hover (mouse only). */
      interactive:
        "ui-card-interactive border-line transition-[border-color,box-shadow,translate] duration-200 can-hover:hover:-translate-y-0.5 can-hover:hover:border-gold/50 can-hover:hover:shadow-glow",
      /** Rows separated by hairlines (lists, tables on phones). */
      list: "ui-card-flat divide-y divide-line overflow-hidden border-line",
      /** Highlighted callout (linked event, "available in store"). */
      accent: "border-gold/30 bg-gold/5",
      /** Gold-edged hero/feature panel. */
      featured: "border-gold/40",
      /** Placeholder for "nothing here yet". */
      dashed: "ui-card-flat border-dashed border-line bg-panel/60",
      /** A recessed surface inside another card (inputs, thumbnails). */
      inset: "ui-card-flat border-line bg-panel-2",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-4 fold:p-6",
      row: "px-4 py-3",
    },
    radius: {
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
    },
  },
  defaultVariants: { variant: "default", padding: "none", radius: "xl" },
});

type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants> & { asChild?: boolean };

function Card({ className, variant, padding, radius, asChild = false, ...props }: CardProps) {
  const Comp = asChild ? Slot : "div";
  return <Comp className={cn(cardVariants({ variant, padding, radius }), className)} {...props} />;
}

export { Card, cardVariants, type CardProps };
