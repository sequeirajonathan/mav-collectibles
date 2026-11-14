import type { EventKind, EventStatus } from "@lib/contracts/hub";
import { isoToStoreLocal } from "@lib/format";

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
  starts_at: Date; ends_at: Date | null; location: string; cover_image_url: string | null; capacity: number | null; entry_fee_cents: number | null;
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
    coverImageUrl: e?.cover_image_url ?? null,
    capacity: e?.capacity?.toString() ?? "",
    entryFeeDollars: e?.entry_fee_cents == null ? "" : (e.entry_fee_cents / 100).toString(),
    registrationOpensAt: local(e?.registration_opens_at ?? null),
    registrationClosesAt: local(e?.registration_closes_at ?? null),
    status: e?.status ?? "draft",
    featured: e?.featured ?? false,
  };
}

