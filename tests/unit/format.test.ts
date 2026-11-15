import { describe, expect, it } from "vitest";
import {
  capacityLabel,
  dateBlock,
  formatEntryFee,
  formatEventWhen,
  formatMoneyCents,
  groupByDay,
  isoToStoreLocal,
  storeLocalToIso,
} from "@lib/format";

describe("store time zone (America/Chicago)", () => {
  it("formats event times in store time regardless of the runner's zone", () => {
    // 00:00Z on Nov 21 is 6 PM Friday Nov 20 in Texas (CST, UTC-6).
    expect(formatEventWhen("2026-11-21T00:00:00Z")).toBe("Fri, Nov 20 · 6:00 PM");
    expect(formatEventWhen("2026-11-21T00:00:00Z", "2026-11-21T03:00:00Z")).toBe("Fri, Nov 20 · 6:00 PM – 9:00 PM");
    expect(dateBlock("2026-11-21T00:00:00Z")).toEqual({ month: "NOV", day: "20", weekday: "Fri" });
  });

  it("round-trips datetime-local values across DST", () => {
    for (const local of ["2026-01-15T18:00", "2026-07-04T12:30", "2026-03-08T03:30", "2026-11-01T01:30"]) {
      expect(isoToStoreLocal(storeLocalToIso(local))).toBe(local);
    }
    expect(storeLocalToIso("2026-11-20T18:00")).toBe("2026-11-21T00:00:00.000Z"); // CST
    expect(storeLocalToIso("2026-07-03T18:00")).toBe("2026-07-03T23:00:00.000Z"); // CDT
  });

  it("groups by store-local day", () => {
    const groups = groupByDay(["2026-11-21T03:00:00Z", "2026-11-21T07:00:00Z", "2026-11-22T00:00:00Z"], (x) => x);
    expect(groups.map((g) => g.items.length)).toEqual([1, 2]); // 03:00Z is still Nov 20 in Texas; the other two are Nov 21
    expect(groups[0].label).toBe("Friday, November 20, 2026");
  });
});

describe("labels", () => {
  it("describes capacity", () => {
    expect(capacityLabel(null, 0, 0)).toBe("Open entry");
    expect(capacityLabel(null, 12, 0)).toBe("12 going");
    expect(capacityLabel(32, 30, 0)).toBe("2 of 32 spots left");
    expect(capacityLabel(2, 2, 0)).toBe("Full · waitlist open");
    expect(capacityLabel(2, 2, 3)).toBe("Full · 3 on waitlist");
  });
  it("describes fees and money", () => {
    expect(formatEntryFee(null)).toBe("Free");
    expect(formatEntryFee(0)).toBe("Free");
    expect(formatEntryFee(500)).toBe("$5 at the door");
    expect(formatMoneyCents(5999)).toBe("$59.99");
  });
});
