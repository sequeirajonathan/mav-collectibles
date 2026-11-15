import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaEnvelope, FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhoneAlt, FaTiktok, FaTwitter, FaYoutube } from "react-icons/fa";
import { STORE_ADDRESS, STORE_PHONE } from "@lib/format";
import { NAV_LINKS } from "./nav-links";
import { DiscordIcon } from "@components/hub/discord";
import { InstallApp } from "./install-app";
import { ShopOnly } from "./shop-only";

const PHONE = STORE_PHONE;
const EMAIL = "info@mavcollectibles.com";
const HOURS = [
  { day: "Mon", hours: "Closed" },
  { day: "Tue–Thu", hours: "12–9 PM" },
  { day: "Fri–Sat", hours: "12–10 PM" },
  { day: "Sun", hours: "12–9 PM" },
];
const SOCIAL = [
  { href: "https://www.instagram.com/mavdamadcollector", label: "Instagram", Icon: FaInstagram },
  { href: "https://www.facebook.com/MavCollectibles", label: "Facebook", Icon: FaFacebook },
  { href: "https://www.youtube.com/MaVDaMaDCoLLeCToR", label: "YouTube", Icon: FaYoutube },
  { href: "https://www.tiktok.com/@mav_collectibles", label: "TikTok", Icon: FaTiktok },
  { href: "https://x.com/MavCollectibles", label: "X", Icon: FaTwitter },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-panel/40 pb-safe">
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-8 px-safe py-10 fold:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/mav_collectibles.png" alt="MAV Collectibles" width={140} height={56} className="h-12 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Your local game store for Pokémon and every TCG in Montgomery, TX.</p>
          <InstallApp className="mt-4 max-w-56" />
          <div className="mt-4 flex flex-wrap gap-1">
            <Suspense fallback={null}>
              <DiscordIcon />
            </Suspense>
            {SOCIAL.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-gold">
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Explore</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm fold:grid-cols-1">
            {NAV_LINKS.map((l) => {
              const item = (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-foreground/80 hover:text-gold">{l.label}</Link>
                </li>
              );
              return l.href === "/shop" ? <ShopOnly key={l.href}>{item}</ShopOnly> : item;
            })}
            <li>
              <Link href="/pokemon-cards-montgomery-tx" className="inline-flex min-h-9 items-center text-foreground/80 hover:text-gold">Pokémon cards</Link>
            </li>
            <li>
              <Link href="/sell-your-cards" className="inline-flex min-h-9 items-center text-foreground/80 hover:text-gold">Sell your cards</Link>
            </li>
            <li>
              <Link href="/visit" className="inline-flex min-h-9 items-center text-foreground/80 hover:text-gold">Visit us</Link>
            </li>
            <li>
              <Link href="/vendors/apply" className="inline-flex min-h-9 items-center text-foreground/80 hover:text-gold">Become a vendor</Link>
            </li>
            <li>
              <Link href="/jobs" className="inline-flex min-h-9 items-center font-semibold text-gold hover:text-gold-light">We&apos;re hiring</Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Visit</h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <FaMapMarkerAlt className="mt-0.5 shrink-0 text-gold" />
              <a href={`https://maps.google.com/?q=${encodeURIComponent(STORE_ADDRESS)}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">{STORE_ADDRESS}</a>
            </li>
            <li className="flex gap-2">
              <FaPhoneAlt className="mt-0.5 shrink-0 text-gold" />
              <a href={`tel:${PHONE.replace(/\D/g, "")}`} className="hover:text-gold">{PHONE}</a>
            </li>
            <li className="flex gap-2">
              <FaEnvelope className="mt-0.5 shrink-0 text-gold" />
              <a href={`mailto:${EMAIL}`} className="hover:text-gold">{EMAIL}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Hours</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {HOURS.map((h) => (
              <div key={h.day} className="contents">
                <dt className="text-muted-foreground">{h.day}</dt>
                <dd className="text-foreground/80">{h.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="border-t border-line px-safe py-4 text-center text-xs text-muted-foreground">
        © MAV Collectibles ·{" "}
        <Link href="/privacy" className="inline-flex min-h-9 items-center hover:text-gold">Privacy</Link>
      </p>
    </footer>
  );
}
