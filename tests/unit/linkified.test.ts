import { describe, expect, it } from "vitest";
import { splitLinks } from "@components/ui/linkified";
import { eventInput } from "@lib/contracts/hub";

describe("links in staff-written text", () => {
  it("turns a pasted address into a link and leaves the sentence's full stop out of it", () => {
    expect(splitLinks("Fill in https://forms.gle/abc123. Thanks!")).toEqual([
      { text: "Fill in " },
      { text: "https://forms.gle/abc123", href: "https://forms.gle/abc123" },
      { text: "." },
      { text: " Thanks!" },
    ]);
  });

  it("keeps line breaks and plain text as they are", () => {
    expect(splitLinks("Line one\nLine two")).toEqual([{ text: "Line one\nLine two" }]);
  });

  it("never links anything that isn't a web address", () => {
    expect(splitLinks("javascript:alert(1) and www.example.com").every((p) => !p.href)).toBe(true);
  });
});

describe("event link field", () => {
  const base = {
    title: "Season 1 Cup", slug: "season-1-cup", summary: "", description: "", kind: "tournament", gameId: "pokemon", format: "",
    startsAt: "2026-11-21T18:15:00.000Z", endsAt: "", location: "MAV Collectibles", coverImageUrl: "", capacity: "", entryFeeDollars: "",
    registrationOpensAt: "", registrationClosesAt: "", status: "draft", featured: false,
  };

  it("is optional", () => {
    expect(eventInput.parse(base)).toMatchObject({ linkUrl: null, linkLabel: null });
    expect(eventInput.parse({ ...base, linkUrl: "", linkLabel: "" })).toMatchObject({ linkUrl: null, linkLabel: null });
  });

  it("accepts a web address and a button label", () => {
    expect(eventInput.parse({ ...base, linkUrl: " https://forms.gle/abc123 ", linkLabel: "Deck list form" })).toMatchObject({
      linkUrl: "https://forms.gle/abc123",
      linkLabel: "Deck list form",
    });
  });

  it("rejects anything that isn't a web address", () => {
    for (const linkUrl of ["javascript:alert(1)", "forms.gle/abc123", "data:text/html,x"]) {
      expect(eventInput.safeParse({ ...base, linkUrl }).success, linkUrl).toBe(false);
    }
  });
});
