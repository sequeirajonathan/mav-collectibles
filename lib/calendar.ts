import { STORE_ADDRESS, STORE_NAME } from "./format";

export interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  startsAt: string;
  /** Defaults to three hours after the start. */
  endsAt?: string | null;
  location?: string;
  url: string;
  cancelled?: boolean;
}

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

const endOf = (e: CalendarEvent) =>
  e.endsAt ? new Date(e.endsAt) : new Date(new Date(e.startsAt).getTime() + DEFAULT_DURATION_MS);

/** 20261121T230000Z */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes text per RFC 5545 §3.3.11. */
export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds lines longer than 75 octets per RFC 5545 §3.1. */
export function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** Builds an iCalendar (.ics) document for one or more events. */
export function buildIcs(events: CalendarEvent[], options: { name?: string; now?: Date } = {}): string {
  const stamp = utcStamp(options.now ?? new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MAV Collectibles//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(options.name ? [`X-WR-CALNAME:${escapeIcsText(options.name)}`, "X-PUBLISHED-TTL:PT1H"] : []),
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@mavcollectibles.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utcStamp(new Date(e.startsAt))}`,
      `DTEND:${utcStamp(endOf(e))}`,
      `SUMMARY:${escapeIcsText(e.title)}`,
      `DESCRIPTION:${escapeIcsText(`${e.description}\n\n${e.url}`.trim())}`,
      `LOCATION:${escapeIcsText(e.location ?? `${STORE_NAME}, ${STORE_ADDRESS}`)}`,
      `URL:${e.url}`,
      `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", e.title);
  url.searchParams.set("dates", `${utcStamp(new Date(e.startsAt))}/${utcStamp(endOf(e))}`);
  url.searchParams.set("details", `${e.description}\n\n${e.url}`.trim());
  url.searchParams.set("location", e.location ?? `${STORE_NAME}, ${STORE_ADDRESS}`);
  return url.toString();
}

export function outlookCalendarUrl(e: CalendarEvent): string {
  const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", e.title);
  url.searchParams.set("startdt", new Date(e.startsAt).toISOString());
  url.searchParams.set("enddt", endOf(e).toISOString());
  url.searchParams.set("body", `${e.description}\n\n${e.url}`.trim());
  url.searchParams.set("location", e.location ?? `${STORE_NAME}, ${STORE_ADDRESS}`);
  return url.toString();
}
