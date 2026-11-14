import { describe, expect, it } from "vitest";
import { accessFor, isAllowed } from "@lib/auth/access";
import { UserRole } from "@interfaces/roles";

const can = (path: string, method: string, role: UserRole | null) => isAllowed(accessFor(path, method), role);
const ALL_ROLES = [null, UserRole.USER, UserRole.EVENT, UserRole.STAFF, UserRole.PRINT_AGENT, UserRole.ADMIN] as const;

describe("route access policy", () => {
  it.each(["/", "/events", "/events/pokemon-league-night", "/feed", "/feed/abc", "/vendors", "/vendors/lone-star-slabs", "/leaderboard", "/shop", "/category/pokemon", "/product/X", "/search", "/cart", "/sign-in", "/maintenance"])(
    "%s is public",
    (path) => {
      for (const role of ALL_ROLES) expect(can(path, "GET", role)).toBe(true);
    }
  );

  it("requires sign-in for personal pages", () => {
    for (const path of ["/dashboard", "/profile", "/vendors/apply", "/reset-password", "/sign-up/complete"]) {
      expect(can(path, "GET", null)).toBe(false);
      expect(can(path, "GET", UserRole.USER)).toBe(true);
    }
  });

  it("treats unknown routes as sign-in required", () => {
    expect(can("/some/new/page", "GET", null)).toBe(false);
    expect(can("/some/new/page", "GET", UserRole.USER)).toBe(true);
  });

  it("lets the event team into content admin but not site settings", () => {
    for (const role of [UserRole.EVENT, UserRole.STAFF, UserRole.ADMIN]) {
      expect(can("/admin", "GET", role)).toBe(true);
      expect(can("/admin/events/123/attendees", "POST", role)).toBe(true);
    }
    for (const role of [null, UserRole.USER, UserRole.PRINT_AGENT]) expect(can("/admin/events", "GET", role)).toBe(false);
    for (const path of ["/admin/site", "/admin/roles", "/admin/downloads"]) {
      expect(can(path, "GET", UserRole.STAFF)).toBe(false);
      expect(can(path, "GET", UserRole.EVENT)).toBe(false);
      expect(can(path, "GET", UserRole.ADMIN)).toBe(true);
    }
  });

  it("only allows reads on the public catalog API", () => {
    expect(can("/api/v1/catalog/search", "GET", null)).toBe(true);
    expect(can("/api/v1/catalog/category/pokemon", "GET", null)).toBe(true);
    expect(can("/api/v1/catalog/search", "POST", UserRole.STAFF)).toBe(false);
    expect(can("/api/v1/catalog/search", "DELETE", UserRole.ADMIN)).toBe(true); // unlisted methods are admin-only
  });

  it("scopes the print queue to print roles", () => {
    expect(can("/api/v1/print-jobs", "GET", UserRole.PRINT_AGENT)).toBe(true);
    expect(can("/api/v1/print-jobs", "PATCH", UserRole.PRINT_AGENT)).toBe(true);
    expect(can("/api/v1/print-jobs", "POST", UserRole.PRINT_AGENT)).toBe(false);
    expect(can("/api/v1/print-jobs", "GET", UserRole.USER)).toBe(false);
    expect(can("/print-agent", "GET", UserRole.USER)).toBe(false);
    expect(can("/print-agent/login", "GET", null)).toBe(true);
  });

  it("matches prefixes only at segment boundaries", () => {
    // Not the public /events rule, and not the /admin rule: just "signed in".
    expect(accessFor("/eventsfoo", "GET")).toBe("user");
    expect(accessFor("/admin-panel", "GET")).toBe("user");
  });

  it("treats HEAD and OPTIONS like GET", () => {
    expect(can("/api/v1/catalog/search", "HEAD", null)).toBe(true);
    expect(can("/api/v1/catalog/search", "OPTIONS", null)).toBe(true);
  });
});
