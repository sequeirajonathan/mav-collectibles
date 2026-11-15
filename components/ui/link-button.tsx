import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@utils";
import { buttonVariants, type ButtonVariantProps } from "./button";

/** A next/link that looks like a <Button>. Server-component friendly. */
export function LinkButton({ className, variant, size, ...props }: ComponentProps<typeof Link> & ButtonVariantProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
