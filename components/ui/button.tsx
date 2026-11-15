import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@utils";

/**
 * One source of truth for anything that looks like a button: <Button>, <LinkButton>
 * and plain <a> tags (`className={buttonVariants({ variant: "outline" })}`).
 * Colours come from the theme tokens in styles/globals.css; focus uses the global
 * gold :focus-visible outline.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-[color,background-color,border-color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Primary call to action. One per view, ideally. */
        gold: "ui-btn bg-cta font-bold text-cta-ink shadow-sm shadow-gold/10 hover:bg-cta-hover hover:shadow-gold/25 active:bg-cta-active",
        /** Secondary action next to a gold one. */
        outline: "ui-btn border border-line bg-panel/40 text-foreground hover:border-gold/60 hover:bg-panel-2",
        /** Tertiary/inline action (cancel, share, back). */
        ghost: "text-foreground/90 hover:bg-panel-2 hover:text-foreground",
        /** Quiet filled surface. */
        secondary: "bg-panel-2 text-foreground hover:bg-panel-2/70",
        /** Irreversible actions. */
        destructive: "border border-danger/50 text-danger hover:bg-danger/10",
        /** Looks like a text link but keeps button semantics. */
        link: "text-gold underline-offset-4 hover:text-gold-light hover:underline",
      },
      size: {
        /** 44px: the default touch target. */
        default: "min-h-11 px-5 text-sm",
        /** Compact; still 44px on touch screens, 36px with a mouse. */
        sm: "min-h-11 px-3 text-sm can-hover:min-h-9",
        lg: "min-h-12 px-6 text-base",
        icon: "size-11 p-0",
      },
    },
    compoundVariants: [{ variant: "link", className: "min-h-0 px-0" }],
    defaultVariants: {
      variant: "gold",
      size: "default",
    },
  }
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  /** Render the child element (e.g. a <Link>) with button styling instead of a <button>. */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, type ButtonProps, type ButtonVariantProps };
