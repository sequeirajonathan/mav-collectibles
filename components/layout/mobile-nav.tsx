"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { InstallApp } from "./install-app";
import { NAV_LINKS } from "./nav-links";
import { cn } from "@utils";

/** Slide-in drawer for phones (incl. the iPhone Duo cover screen). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState(pathname);
  // Close the drawer after navigating (adjusting state during render, not in an effect).
  if (open && pathname !== openedOn) {
    setOpen(false);
    setOpenedOn(pathname);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => {
          setOpenedOn(pathname);
          setOpen(true);
        }}
        className="inline-flex size-11 items-center justify-center rounded-md hover:bg-panel-2"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="size-6" />
      </button>
      {/* Rendered on <body>: the header's backdrop blur would otherwise trap a
          fixed element inside the header bar. */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/70"
              onClick={() => setOpen(false)}
            />
            <nav
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col gap-1 overflow-y-auto overscroll-contain border-l border-line bg-panel p-4 pb-safe pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-widest text-gold">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-11 items-center justify-center rounded-md hover:bg-panel-2"
                  aria-label="Close menu"
                >
                  <X className="size-6" />
                </button>
              </div>
              <form
                action="/search"
                className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-3"
              >
                <Search className="size-4 text-muted-foreground" />
                <label htmlFor="mobile-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder="Search products"
                  className="min-h-11 w-full bg-transparent text-base outline-none"
                />
              </form>
              <ThemeToggle
                withLabel
                className="mb-2 justify-start border border-line"
              />
              <InstallApp className="mb-2" />
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-3 text-lg font-semibold",
                    pathname.startsWith(link.href)
                      ? "bg-gold/10 text-gold"
                      : "text-foreground hover:bg-panel-2",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
