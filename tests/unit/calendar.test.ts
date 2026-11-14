import { describe, expect, it } from "vitest";
import { buildIcs, escapeIcsText, foldIcsLine, googleCalendarUrl } from "@lib/calendar";

const event = {
  uid: "abc",
  title: "Pokémon League Night; Standard, Bo1",
  description: "Bring a deck\nPrizes for top 4",
  startsAt: "2026-11-21T00:00:00.000Z",
  url: "https://mavcollectibles.com/events/league",
};

describe("ICS", () => {
  it("escapes special characters", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("folds long lines at 75 octets without splitting characters", () => {
    const line = `SUMMARY:${"é".repeat(60)}`;
    const folded = foldIcsLine(line);
    for (const part of folded.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
  });

  it("builds a valid calendar with a 3-hour default duration and CRLF line endings", () => {
    const ics = buildIcs([event], { name: "MAV", now: new Date("2026-11-01T00:00:00Z") });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261121T000000Z");
    expect(ics).toContain("DTEND:20261121T030000Z");
    expect(ics).toContain("SUMMARY:Pokémon League Night\\; Standard\\, Bo1");
    expect(ics).toContain("UID:abc@mavcollectibles.com");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("marks cancelled events", () => {
    expect(buildIcs([{ ...event, cancelled: true }])).toContain("STATUS:CANCELLED");
  });

  it("builds a Google Calendar link", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261121T000000Z/20261121T030000Z");
    expect(url.searchParams.get("text")).toBe(event.title);
  });
});
