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
  ["/admin/guide", CONTENT],
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
        let response = await page.goto(path);
        // A page that redirects after it starts loading (the dashboard does, for print agents) can land its
        // redirect on top of the next navigation. That navigation reports no response; make it again.
        if (response === null) response = await page.goto(path);
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
      // A misspelled, partial name is enough: pick the person from the suggestions.
      await form.getByRole("searchbox", { name: "Find a person" }).fill("staf@mav");
      await form.getByRole("list", { name: "People" }).getByRole("button", { name: /staff@mav\.local/ }).click();
      await form.getByRole("radio", { name: role }).check();
      const update = form.getByRole("button", { name: "Update role" });
      // Nothing to save when they already have that role.
      if (await update.isDisabled()) return;
      await update.click();
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

test.describe("finding people on the roles screen", () => {
  test("suggestions, a team list, and a clear message when nobody matches", async ({ browser }) => {
    const admin = await pageFor(browser, "admin");
    await admin.goto("/admin/roles");
    const form = admin.locator("form").filter({ visible: true }).filter({ has: admin.getByRole("button", { name: "Update role" }) });

    // Before typing: the newest accounts, and nothing can be saved without picking someone.
    await expect(form.getByText("Newest accounts")).toBeVisible();
    await expect(form.getByRole("button", { name: "Update role" })).toBeDisabled();

    // The team list shows who already has access.
    const team = admin.getByRole("region", { name: /Who has access/ });
    await expect(team.getByRole("button", { name: /admin@mav\.local/ })).toContainText("Admin");
    await expect(team.getByRole("button", { name: /customer@mav\.local/ })).toHaveCount(0);

    // A close spelling still finds the person, with their current role shown.
    const search = form.getByRole("searchbox", { name: "Find a person" });
    await search.fill("custmer");
    await expect(form.getByRole("list", { name: "People" }).getByRole("button", { name: /customer@mav\.local/ })).toContainText("Customer");

    await search.fill("zzzz-nobody-here");
    await expect(form.getByRole("status")).toContainText("Nobody matches");
    await admin.context().close();
  });

  test("only admins can search people", async ({ browser }) => {
    const staff = await pageFor(browser, "staff");
    await staff.goto("/admin/roles");
    await expect(staff).not.toHaveURL(/\/admin\/roles/);
    await staff.context().close();
  });
});
