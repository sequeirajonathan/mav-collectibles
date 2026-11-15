import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@utils";

/** Small rounded label: event kind, status, role, counts. */
const badgeVariants = cva("ui-badge inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      neutral: "border-line bg-panel-2 font-medium text-muted-foreground",
      outline: "border-line text-muted-foreground",
      gold: "border-gold/40 bg-gold/10 text-gold",
      success: "border-success/40 text-success",
      danger: "border-danger/50 text-danger",
    },
  },
  defaultVariants: { variant: "neutral" },
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
