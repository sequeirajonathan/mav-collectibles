import type { EventKind, EventStatus } from "@lib/contracts/hub";
import { isoToStoreLocal } from "@lib/format";
import { parseStoredQuestions, type EventQuestion } from "@lib/event-questions";

// Shared by the server page (initial values) and the client form, so it must
// not live in a "use client" module.
export interface EventFormValues {
  title: string;
  slug: string;
  summary: string;
  description: string;
  kind: EventKind;
  gameId: string;
  format: string;
  startsAt: string; // store-local datetime-local value
  endsAt: string;
  location: string;
  linkUrl: string;
  linkLabel: string;
  questions: EventQuestion[];
  coverImageUrl: string | null;
  capacity: string;
  entryFeeDollars: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  status: EventStatus;
  featured: boolean;
}

export function eventFormDefaults(e?: {
  title: string; slug: string; summary: string; description: string; kind: EventKind; game_id: string | null; format: string | null;
  starts_at: Date; ends_at: Date | null; location: string; link_url: string | null; link_label: string | null; questions?: unknown; cover_image_url: string | null; capacity: number | null; entry_fee_cents: number | null;
  registration_opens_at: Date | null; registration_closes_at: Date | null; status: EventStatus; featured: boolean;
}): EventFormValues {
  const local = (d: Date | null) => (d ? isoToStoreLocal(d.toISOString()) : "");
  return {
    title: e?.title ?? "",
    slug: e?.slug ?? "",
    summary: e?.summary ?? "",
    description: e?.description ?? "",
    kind: e?.kind ?? "tournament",
    gameId: e?.game_id ?? "pokemon",
    format: e?.format ?? "",
    startsAt: local(e?.starts_at ?? null),
    endsAt: local(e?.ends_at ?? null),
    location: e?.location ?? "MAV Collectibles",
    linkUrl: e?.link_url ?? "",
    linkLabel: e?.link_label ?? "",
    questions: parseStoredQuestions(e?.questions ?? []),
    coverImageUrl: e?.cover_image_url ?? null,
    capacity: e?.capacity?.toString() ?? "",
    entryFeeDollars: e?.entry_fee_cents == null ? "" : (e.entry_fee_cents / 100).toString(),
    registrationOpensAt: local(e?.registration_opens_at ?? null),
    registrationClosesAt: local(e?.registration_closes_at ?? null),
    status: e?.status ?? "draft",
    featured: e?.featured ?? false,
  };
}


/**
 * Starting points for a new event, based on how the shop actually runs them
 * (formats and door prices from its Square "League Tournaments & Play" items).
 */
interface EventTemplate {
  label: string;
  values: Pick<EventFormValues, "title" | "kind" | "gameId" | "format" | "entryFeeDollars" | "capacity" | "summary">;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  { label: "Pokémon League night", values: { title: "Pokémon League Night", kind: "league", gameId: "pokemon", format: "Standard", entryFeeDollars: "5", capacity: "32", summary: "Weekly league play. All skill levels welcome." } },
  { label: "Pokémon League Challenge", values: { title: "Pokémon League Challenge", kind: "tournament", gameId: "pokemon", format: "Standard", entryFeeDollars: "10", capacity: "32", summary: "Sanctioned League Challenge. Bring a deck list." } },
  { label: "MAV Cup", values: { title: "MAV's Cup", kind: "tournament", gameId: "pokemon", format: "Standard", entryFeeDollars: "20", capacity: "64", summary: "Our monthly Cup with prizing for top finishers." } },
  { label: "Pre-release", values: { title: "Pre-release", kind: "prerelease", gameId: "pokemon", format: "Sealed", entryFeeDollars: "35", capacity: "32", summary: "Play the new set early. Kit included with entry." } },
  { label: "Release event", values: { title: "Release Event", kind: "release", gameId: "one-piece", format: "Sealed", entryFeeDollars: "35", capacity: "32", summary: "Celebrate the new set with sealed play and promos." } },
  { label: "Store tournament", values: { title: "Store Tournament", kind: "tournament", gameId: "one-piece", format: "Constructed", entryFeeDollars: "10", capacity: "32", summary: "Weekly store tournament with promo prizing." } },
  { label: "Set championship", values: { title: "Set Championship", kind: "tournament", gameId: "lorcana", format: "Constructed", entryFeeDollars: "20", capacity: "32", summary: "Compete for the set championship playmat and promos." } },
  { label: "Vendor & trade day", values: { title: "Vendor & Trade Day", kind: "vendor_day", gameId: "", format: "", entryFeeDollars: "0", capacity: "", summary: "Local vendors set up at the shop. Bring your binder." } },
];
