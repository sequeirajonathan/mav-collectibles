import { describe, expect, it } from "vitest";
import { eventInput, postInput, resultsInput, seasonInput, vendorApplicationInput } from "@lib/contracts/hub";
import { alertBannerInput, setFlagInput, youTubeSettingsInput } from "@lib/contracts/site";
import { categoryQuerySchema, catalogPageSchema } from "@lib/contracts/catalog";
import { apiErrorSchema, isoDateTime, slug } from "@lib/contracts/common";
import { updateCustomerInput, updateCustomerResponse } from "@lib/contracts/customer";

const validEvent = {
  title: "Pokémon League Night",
  slug: "pokemon-league-night",
  summary: "",
  description: "",
  kind: "league",
  gameId: "pokemon",
  format: "",
  startsAt: "2026-11-21T00:00:00.000Z",
  endsAt: "",
  location: "MAV Collectibles",
  coverImageUrl: "",
  capacity: "32",
  entryFeeDollars: "5",
  registrationOpensAt: "",
  registrationClosesAt: "",
  status: "published",
  featured: false,
};

describe("event input", () => {
  it("coerces form strings and blanks", () => {
    const e = eventInput.parse(validEvent);
    expect(e.capacity).toBe(32);
    expect(e.entryFeeDollars).toBe(5);
    expect(e.endsAt).toBeNull();
    expect(e.format).toBeNull();
    expect(e.coverImageUrl).toBeNull();
    expect(e.startsAt).toBeInstanceOf(Date);
  });
  it("treats blank capacity as unlimited", () => {
    expect(eventInput.parse({ ...validEvent, capacity: "" }).capacity).toBeNull();
  });
  it("rejects an end before the start", () => {
    const r = eventInput.safeParse({ ...validEvent, endsAt: "2026-11-20T00:00:00.000Z" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["endsAt"]);
  });
  it("rejects bad slugs, kinds and negative fees", () => {
    expect(eventInput.safeParse({ ...validEvent, slug: "Bad Slug!" }).success).toBe(false);
    expect(eventInput.safeParse({ ...validEvent, kind: "raid" }).success).toBe(false);
    expect(eventInput.safeParse({ ...validEvent, entryFeeDollars: "-1" }).success).toBe(false);
  });
});

describe("post and comment input", () => {
  it("normalizes optional relations", () => {
    const p = postInput.parse({ title: "Hello world", body: "", imageUrl: "", gameId: "", eventId: "", pinned: false, status: "draft" });
    expect(p).toMatchObject({ imageUrl: null, gameId: null, eventId: null });
  });
  it("only accepts uuids for linked events", () => {
    expect(postInput.safeParse({ title: "Hello world", body: "", imageUrl: null, gameId: null, eventId: "nope", pinned: false, status: "draft" }).success).toBe(false);
  });
});

describe("vendor application", () => {
  const base = { name: "Lone Star Slabs", bio: "", specialties: "", games: ["pokemon"], website: "", contactEmail: "a@b.co", eventId: "", message: "" };
  it.each([
    ["@lonestarslabs", "lonestarslabs"],
    ["https://www.instagram.com/lonestarslabs/", "lonestarslabs"],
    ["", null],
  ])("normalizes instagram %s", (input, expected) => {
    expect(vendorApplicationInput.parse({ ...base, instagram: input }).instagram).toBe(expected);
  });
  it("requires a contact email", () => {
    expect(vendorApplicationInput.safeParse({ ...base, instagram: "", contactEmail: "nope" }).success).toBe(false);
  });
});

describe("tournament input", () => {
  const row = { placement: "1", playerName: "Ash", userId: "", wins: "3", losses: "0", draws: "0", points: "10", deck: "" };
  it("coerces numbers and blanks", () => {
    const r = resultsInput.parse({ eventId: "6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", rows: [row] });
    expect(r.rows[0]).toMatchObject({ placement: 1, wins: 3, points: 10, userId: null, deck: null });
  });
  it("rejects duplicate players (case-insensitive)", () => {
    const r = resultsInput.safeParse({ eventId: "6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", rows: [row, { ...row, playerName: "ASH", placement: "2" }] });
    expect(r.success).toBe(false);
  });
  it("rejects seasons that end before they start", () => {
    expect(seasonInput.safeParse({ gameId: "pokemon", name: "Winter", startsOn: "2026-12-01", endsOn: "2026-11-01" }).success).toBe(false);
  });
});

describe("site settings input", () => {
  it("validates banner colors and flags", () => {
    expect(alertBannerInput.safeParse({ message: "Hi", code: "", backgroundColor: "gold", textColor: "#000000", enabled: true }).success).toBe(false);
    expect(alertBannerInput.parse({ message: "Hi", code: "", backgroundColor: "#E6B325", textColor: "#000000", enabled: true }).code).toBeNull();
    expect(setFlagInput.safeParse({ name: "shopLive", enabled: true }).success).toBe(true);
    expect(setFlagInput.safeParse({ name: "notAFlag", enabled: true }).success).toBe(false);
    expect(youTubeSettingsInput.safeParse({ videoId: "https://youtube.com/watch?v=x", title: "x", autoplay: false, muted: true, playlistId: "" }).success).toBe(false);
  });
});

describe("catalog and common contracts", () => {
  it("applies catalog query defaults and limits", () => {
    expect(categoryQuerySchema.parse({})).toMatchObject({ stock: "IN_STOCK", sort: "name_asc", limit: 24 });
    expect(categoryQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });
  it("requires a cursor key on catalog pages", () => {
    expect(catalogPageSchema.safeParse({ items: [] }).success).toBe(false);
    expect(catalogPageSchema.safeParse({ items: [], cursor: null }).success).toBe(true);
  });
  it("serializes dates and validates slugs", () => {
    expect(isoDateTime.parse(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01T00:00:00.000Z");
    expect(slug.parse("  Pokemon-League ")).toBe("pokemon-league");
    expect(slug.safeParse("two--dashes").success).toBe(false);
  });
  it("describes API errors", () => {
    expect(apiErrorSchema.safeParse({ error: { code: "NOT_FOUND", message: "x" } }).success).toBe(true);
    expect(apiErrorSchema.safeParse({ error: "x" }).success).toBe(false);
  });
  it("discriminates customer update responses", () => {
    expect(updateCustomerResponse.parse({ status: "invalid_address", messages: [] }).status).toBe("invalid_address");
    expect(updateCustomerInput.safeParse({ phoneNumber: "5555550100" }).success).toBe(false);
    expect(updateCustomerInput.safeParse({ phoneNumber: "+15555550100" }).success).toBe(true);
  });
});
