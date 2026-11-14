import { describe, expect, it } from "vitest";
import { isFull, registrationClosedReason, upcomingOnly } from "@lib/hub-rules";

const base = {
  status: "published" as const,
  startsAt: "2026-11-21T00:00:00Z",
  registrationOpensAt: null,
  registrationClosesAt: null,
};
const t = (iso: string) => new Date(iso).getTime();

describe("registrationClosedReason", () => {
  it("is open before the start", () => {
    expect(registrationClosedReason(base, t("2026-11-20T23:00:00Z"))).toBeNull();
  });
  it("closes at the start by default, or at an explicit close time", () => {
    expect(registrationClosedReason(base, t("2026-11-21T00:01:00Z"))).toBe("Registration closed");
    expect(registrationClosedReason({ ...base, registrationClosesAt: "2026-11-20T20:00:00Z" }, t("2026-11-20T21:00:00Z"))).toBe("Registration closed");
  });
  it("says when registration opens", () => {
    expect(registrationClosedReason({ ...base, registrationOpensAt: "2026-11-15T15:00:00Z" }, t("2026-11-10T00:00:00Z"))).toMatch(/^Opens /);
  });
  it("handles cancelled and completed events", () => {
    expect(registrationClosedReason({ ...base, status: "cancelled" }, 0)).toBe("Event cancelled");
    expect(registrationClosedReason({ ...base, status: "completed" }, 0)).toBe("Registration closed");
  });
});

describe("capacity and upcoming", () => {
  it("knows when an event is full", () => {
    expect(isFull({ capacity: null, registeredCount: 100 })).toBe(false);
    expect(isFull({ capacity: 2, registeredCount: 1 })).toBe(false);
    expect(isFull({ capacity: 2, registeredCount: 2 })).toBe(true);
  });
  it("keeps published events that haven't finished", () => {
    const now = t("2026-11-21T02:00:00Z");
    const events = [
      { status: "published" as const, startsAt: "2026-11-21T00:00:00Z" },
      { status: "published" as const, startsAt: "2026-11-20T00:00:00Z" },
      { status: "draft" as const, startsAt: "2026-11-22T00:00:00Z" },
    ];
    expect(upcomingOnly(events, now)).toEqual([events[0]]);
  });
});
