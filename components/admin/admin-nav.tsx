"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@utils";

const LINKS: { href: Route; label: string; adminOnly?: boolean }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/seasons", label: "Seasons" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/site", label: "Site", adminOnly: true },
  { href: "/admin/roles", label: "Roles", adminOnly: true },
  { href: "/admin/downloads", label: "Downloads", adminOnly: true },
];

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:px-0">
      {LINKS.filter((l) => isAdmin || !l.adminOnly).map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold",
              active ? "bg-gold text-ink" : "text-muted-foreground hover:bg-panel-2 hover:text-foreground"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
