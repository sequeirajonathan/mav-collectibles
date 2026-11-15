import { describe, expect, it } from "vitest";
import { safeNext } from "@lib/auth/redirect";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/events/pokemon?x=1")).toBe("/events/pokemon?x=1");
  });
  it.each([
    "//evil.example.com",
    "/\\evil.example.com",
    "/\t/evil.example.com",
    "/\n/evil.example.com",
    "/\r//evil.example.com",
    "https://evil.example.com",
    "javascript:alert(1)",
    "",
    null,
    undefined,
  ])(
    "rejects %s",
    (value) => {
      expect(safeNext(value)).toBe("/dashboard");
    }
  );
  it("keeps an encoded tab as a harmless same-site path", () => {
    expect(safeNext("/%09/evil.example.com")).toBe("/%09/evil.example.com");
  });
  it("uses the given fallback", () => {
    expect(safeNext("https://x.test", "/feed")).toBe("/feed");
  });
});
