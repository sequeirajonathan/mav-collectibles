import { expect, test, type Browser, type Page } from "@playwright/test";
import { signInAs } from "./helpers";

/**
 * Every role against every protected area: pages, the browser-facing API and
 * what the admin navigation offers. Expected outcomes:
 *   ok      → the page renders
 *   signin  → redirected to /sign-in
 *   home    → redirected to /
 *   agent   → redirected to /print-agent/login
 */
type Role = "anon" | "customer" | "events" | "staff" | "printer" | "admin";
type Outcome = "ok" | "signin" | "home" | "agent";

const ROLES: Role[] = ["anon", "customer", "events", "staff", "printer", "admin"];

const CONTENT: Record<Role, Outcome> = { anon: "signin", customer: "home", events: "ok", staff: "ok", printer: "home", admin: "ok" };
const HIRING: Record<Role, Outcome> = { anon: "signin", customer: "home", events: "home", staff: "ok", printer: "home", admin: "ok" };
const ADMIN_ONLY: Record<Role, Outcome> = { anon: "signin", customer: "home", events: "home", staff: "home", printer: "home", admin: "ok" };
const SIGNED_IN: Record<Role, Outcome> = { anon: "signin", customer: "ok", events: "ok", staff: "ok", printer: "ok", admin: "ok" };
const PUBLIC: Record<Role, Outcome> = { anon: "ok", customer: "ok", events: "ok", staff: "ok", printer: "ok", admin: "ok" };
const PRINT: Record<Role, Outcome> = { anon: "agent", customer: "agent", events: "agent", staff: "ok", printer: "ok", admin: "ok" };

const PAGES: [string, Record<Role, Outcome>][] = [
  ["/", PUBLIC],
  ["/events", PUBLIC],
  ["/feed", PUBLIC],
  ["/vendors", PUBLIC],
  ["/leaderboard", PUBLIC],
  ["/shop", PUBLIC],
  ["/privacy", PUBLIC],
  ["/jobs", PUBLIC],
  ["/pokemon-cards-montgomery-tx", PUBLIC],
  ["/sell-your-cards", PUBLIC],
  ["/visit", PUBLIC],
  ["/dashboard", SIGNED_IN],
  ["/profile", SIGNED_IN],
  ["/vendors/apply", SIGNED_IN],
  ["/admin", CONTENT],
  ["/admin/events", CONTENT],
  ["/admin/events/new", CONTENT],
  ["/admin/posts", CONTENT],
  ["/admin/posts/new", CONTENT],
  ["/admin/vendors", CONTENT],
  ["/admin/seasons", CONTENT],
  ["/admin/photos", CONTENT],
  ["/admin/requests", CONTENT],
  ["/admin/chat", CONTENT],
  ["/admin/applications", HIRING],
  ["/admin/site", ADMIN_ONLY],
  ["/admin/roles", ADMIN_ONLY],
  ["/admin/downloads", ADMIN_ONLY],
  ["/print-agent", PRINT],
];

const EMAIL: Record<Exclude<Role, "anon">, string> = {
  customer: "customer@mav.local",
  events: "events@mav.local",
  staff: "staff@mav.local",
  printer: "printer@mav.local",
  admin: "admin@mav.local",
};

async function pageFor(browser: Browser, role: Role): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  if (role !== "anon") await signInAs(page, EMAIL[role]);
  return page;
}

function outcomeOf(url: URL, requested: string): Outcome | `other:${string}` {
  if (url.pathname === requested) return "ok";
  if (url.pathname === "/sign-in") return "signin";
  if (url.pathname === "/print-agent/login") return "agent";
  if (url.pathname === "/") return "home";
  return `other:${url.pathname}`;
}

test.describe("role matrix", () => {
  for (const role of ROLES) {
    test(`pages as ${role}`, async ({ browser }) => {
      test.setTimeout(180_000);
      const page = await pageFor(browser, role);
      const results: string[] = [];
      for (const [path, expected] of PAGES) {
        const response = await page.goto(path);
        const actual = outcomeOf(new URL(page.url()), path);
        if (actual !== expected[role] || (response && response.status() >= 500)) {
          results.push(`${path}: expected ${expected[role]}, got ${actual} (${response?.status() ?? "?"})`);
        }
      }
      expect(results, results.join("\n")).toEqual([]);
      await page.context().close();
    });

    test(`print-jobs API as ${role}`, async ({ browser }) => {
      const page = await pageFor(browser, role);
      const list = await page.request.get("/api/v1/print-jobs");
      const create = await page.request.post("/api/v1/print-jobs", {
        data: { order_id: `matrix-${role}`, label_url: "file:///etc/passwd" },
      });
      const canList = role === "staff" || role === "printer" || role === "admin";
      expect(list.status()).toBe(role === "anon" ? 401 : canList ? 200 : 403);
      // Only admins get past auth, and even then a non-https label is rejected.
      expect(create.status()).toBe(role === "anon" ? 401 : role === "admin" ? 400 : 403);
      await page.context().close();
    });
  }

  test("admin navigation only offers what the role can open", async ({ browser }) => {
    const events = await pageFor(browser, "events");
    await events.goto("/admin");
    const nav = events.getByRole("navigation", { name: /admin/i });
    await expect(nav.getByRole("link", { name: /events/i })).toBeVisible();
    for (const name of [/site/i, /roles/i, /downloads/i]) {
      await expect(nav.getByRole("link", { name })).toHaveCount(0);
    }
    await events.context().close();
  });
});

test.describe("role changes", () => {
  test("a demoted user loses access immediately, even with an unexpired token", async ({ browser }) => {
    const admin = await pageFor(browser, "admin");
    const setRole = async (role: RegExp) => {
      await admin.goto("/admin/roles");
      // While the page streams in, its form can briefly exist twice; use the visible one.
      const form = admin.locator("form").filter({ visible: true }).filter({ has: admin.getByRole("button", { name: "Update role" }) });
      await form.getByLabel("Email, username or user ID").fill("staff@mav.local");
      await form.getByRole("radio", { name: role }).check();
      await form.getByRole("button", { name: "Update role" }).click();
      await expect(admin.getByText(/staff is now/i)).toBeVisible();
    };

    // Start from a known state, so a retry after a failed attempt still works.
    await setRole(/^staff/i);
    const staff = await pageFor(browser, "staff");
    await staff.goto("/admin/events");
    await expect(staff).toHaveURL(/\/admin\/events$/);

    try {
      await setRole(/^customer|^user/i);
      // The staff browser still holds an access token that says STAFF.
      await staff.goto("/admin/events");
      await expect(staff).not.toHaveURL(/\/admin/);
    } finally {
      await setRole(/^staff/i);
      await admin.context().close();
      await staff.context().close();
    }
  });
});
