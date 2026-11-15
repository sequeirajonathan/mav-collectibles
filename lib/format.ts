/** The shop's time zone. Every event time is shown in it, on server and client alike. */
export const STORE_TIME_ZONE = "America/Chicago";
export const STORE_NAME = "MAV Collectibles";
export const STORE_ADDRESS = "19786 Hwy 105 W ste 190, Montgomery, TX 77356";

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: STORE_TIME_ZONE, ...options });

const weekdayDate = fmt({ weekday: "short", month: "short", day: "numeric" });
const time = fmt({ hour: "numeric", minute: "2-digit" });
const longDate = fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
const shortDate = fmt({ month: "short", day: "numeric", year: "numeric" });
const monthShort = fmt({ month: "short" });
const dayOfMonth = fmt({ day: "numeric" });
const weekdayShort = fmt({ weekday: "short" });
const dayKey = fmt({ year: "numeric", month: "2-digit", day: "2-digit" });

/** "Fri, Nov 21 · 6:00 PM" (or "… – 9:00 PM" when an end on the same day is given). */
export function formatEventWhen(startsAt: string, endsAt?: string | null): string {
  const start = new Date(startsAt);
  const base = `${weekdayDate.format(start)} · ${time.format(start)}`;
  if (!endsAt) return base;
  const end = new Date(endsAt);
  return dayKey.format(start) === dayKey.format(end)
    ? `${base} – ${time.format(end)}`
    : `${base} – ${weekdayDate.format(end)} ${time.format(end)}`;
}

export const formatLongDate = (iso: string) => longDate.format(new Date(iso));
export const formatShortDate = (iso: string) => shortDate.format(new Date(iso));

/** Parts for a calendar-style date block. */
export function dateBlock(iso: string) {
  const d = new Date(iso);
  return { month: monthShort.format(d).toUpperCase(), day: dayOfMonth.format(d), weekday: weekdayShort.format(d) };
}

/** Groups items by calendar day in the store's time zone, preserving order. */
export function groupByDay<T>(items: T[], getIso: (item: T) => string): { key: string; label: string; items: T[] }[] {
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const item of items) {
    const iso = getIso(item);
    const key = dayKey.format(new Date(iso));
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, label: longDate.format(new Date(iso)), items: [item] });
  }
  return groups;
}

export function formatMoneyCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

export function formatEntryFee(cents: number | null): string {
  if (cents === null) return "Free";
  if (cents === 0) return "Free";
  return `${formatMoneyCents(cents)} at the door`;
}

/** "3 spots left", "Full · 2 on waitlist", "12 going". */
export function capacityLabel(capacity: number | null, registered: number, waitlist: number): string {
  if (capacity === null) return registered === 0 ? "Open entry" : `${registered} going`;
  const left = capacity - registered;
  if (left > 0) return `${left} of ${capacity} spot${capacity === 1 ? "" : "s"} left`;
  return waitlist > 0 ? `Full · ${waitlist} on waitlist` : "Full · waitlist open";
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STORE_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Milliseconds the store time zone is ahead of UTC at `date`. */
function storeOffset(date: Date): number {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-11-21T18:00" (store wall-clock time) → ISO UTC string. Handles DST. */
export function storeLocalToIso(local: string): string {
  const [datePart, timePart = "00:00"] = local.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let utc = guess - storeOffset(new Date(guess));
  utc = guess - storeOffset(new Date(utc));
  return new Date(utc).toISOString();
}

/** ISO UTC string → "2026-11-21T18:00" in store wall-clock time (for datetime-local inputs). */
export function isoToStoreLocal(iso: string): string {
  const p = Object.fromEntries(partsFormatter.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
