"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@utils";

export function NavLink({ href, children }: { href: Route; children: React.ReactNode }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-md px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "text-gold after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold"
          : "text-foreground/80 hover:bg-panel-2 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
