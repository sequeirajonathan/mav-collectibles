import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { NAV_LINKS } from "./nav-links";
import { AccountMenu, CartLink } from "./account-menu";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";
import { ShopOnly } from "./shop-only";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md [--header-h:4rem]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-safe short:h-12 lg:gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="MAV Collectibles home">
          <Image src="/mav_collectibles.png" alt="" width={120} height={48} priority className="h-10 w-auto short:h-8" />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            // Plain link in the static shell; the active state streams in.
            <Suspense
              key={link.href}
              // Links that can be switched off wait for the check, so they never flash while hidden.
              fallback={link.href === "/shop" || link.href === "/vendors" ? null : <Link href={link.href} className="rounded-md px-3 py-2 text-sm font-semibold text-foreground/80">{link.label}</Link>}
            >
              <NavLink href={link.href}>{link.label}</NavLink>
            </Suspense>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ShopOnly>
          <form action="/search" className="hidden items-center gap-2 rounded-full border border-line bg-panel px-3 transition-[border-color,box-shadow] focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 lg:flex">
            <Search className="size-4 text-muted-foreground" />
            <label htmlFor="header-search" className="sr-only">Search products</label>
            <input id="header-search" name="q" type="search" placeholder="Search products" className="h-9 w-44 bg-transparent text-sm outline-none" />
          </form>
          <Link href="/search" className="inline-flex size-11 items-center justify-center rounded-md hover:bg-panel-2 lg:hidden" aria-label="Search products">
            <Search className="size-5" />
          </Link>
          </ShopOnly>
          <ThemeToggle className="hidden fold:inline-flex" />
          <CartLink />
          <AccountMenu />
          <Suspense fallback={<span className="inline-block size-11 md:hidden" aria-hidden />}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
      {/* Gold hairline under the header. */}
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </header>
  );
}
