import { publicEnv } from "@lib/env";
import { STORE_NAME, STORE_PHONE } from "@lib/format";

/** The public address of the site, without a trailing slash. */
export const siteUrl = () => (publicEnv().NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const STORE = {
  street: "19786 Hwy 105 W Ste 190",
  city: "Montgomery",
  region: "TX",
  postalCode: "77356",
  latitude: 30.3863778,
  longitude: -95.6665075,
  email: "info@mavcollectibles.com",
  /** Opening hours as shown in the footer (store local time). */
  hours: [
    { days: ["Tuesday", "Wednesday", "Thursday", "Sunday"], opens: "12:00", closes: "21:00" },
    { days: ["Friday", "Saturday"], opens: "12:00", closes: "22:00" },
  ],
  sameAs: [
    "https://www.facebook.com/MavCollectibles",
    "https://www.instagram.com/mavdamadcollector",
    "https://www.youtube.com/MaVDaMaDCoLLeCToR",
    "https://www.tiktok.com/@mav_collectibles",
    "https://x.com/MavCollectibles",
  ],
  /** Nearby places people search from. */
  areas: ["Montgomery", "Conroe", "Lake Conroe", "Willis", "Magnolia", "The Woodlands"],
} as const;

const address = {
  "@type": "PostalAddress",
  streetAddress: STORE.street,
  addressLocality: STORE.city,
  addressRegion: STORE.region,
  postalCode: STORE.postalCode,
  addressCountry: "US",
};

/** schema.org description of the shop, for search engines and maps. */
export function storeJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "HobbyShop"],
    "@id": `${url}/#store`,
    name: STORE_NAME,
    description:
      "Local game store in Montgomery, TX for Pokémon and trading card games: sealed product, singles, graded cards, league nights, tournaments and pre-releases. We buy, sell and trade.",
    url,
    image: `${url}/og.png`,
    logo: `${url}/icons/icon-512.png`,
    telephone: `+1${STORE_PHONE.replace(/\D/g, "")}`,
    email: STORE.email,
    address,
    geo: { "@type": "GeoCoordinates", latitude: STORE.latitude, longitude: STORE.longitude },
    areaServed: STORE.areas.map((name) => ({ "@type": "City", name: `${name}, TX` })),
    openingHoursSpecification: STORE.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    sameAs: STORE.sameAs,
  };
}

interface EventForSeo {
  slug: string;
  title: string;
  summary: string;
  startsAt: string;
  endsAt: string | null;
  coverImageUrl: string | null;
  entryFeeCents: number | null;
  status: string;
  capacity: number | null;
  registeredCount: number;
}

/** schema.org Event for an event page, so it can appear as an event listing in search. */
export function eventJsonLd(event: EventForSeo) {
  const url = `${siteUrl()}/events/${event.slug}`;
  const full = event.capacity !== null && event.registeredCount >= event.capacity;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary || `${event.title} at ${STORE_NAME}.`,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    image: [event.coverImageUrl ?? `${siteUrl()}/og.png`],
    location: { "@type": "Place", name: STORE_NAME, address },
    organizer: { "@type": "Organization", name: STORE_NAME, url: siteUrl() },
    ...(event.entryFeeCents !== null
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: (event.entryFeeCents / 100).toFixed(2),
            priceCurrency: "USD",
            availability: full ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

