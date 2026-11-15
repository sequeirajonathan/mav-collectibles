import { expect, test, type Page } from "@playwright/test";
import { signInAs } from "./helpers";

const PUBLIC_PAGES = [
  "/",
  "/events",
  "/events/pokemon-league-night",
  "/events/vendor-day",
  "/events/pokemon-cup-last-month",
  "/feed",
  "/vendors",
  "/vendors/lone-star-slabs",
  "/leaderboard",
  "/shop",
  "/category/pokemon?group=TCG",
  "/product/4I2PLGWBAL4UQVPQXQZOU6W3",
  "/search?q=box",
  "/cart",
  "/maintenance",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
];

const ADMIN_PAGES = [
  "/dashboard",
  "/profile",
  "/vendors/apply",
  "/admin",
  "/admin/chat",
  "/admin/guide",
  "/admin/photos",
  "/admin/requests",
  "/admin/applications",
  "/admin/downloads",
  "/admin/events",
  "/admin/events/new",
  "/admin/posts",
  "/admin/posts/new",
  "/admin/vendors",
  "/admin/seasons",
  "/admin/site",
  "/admin/roles",
];

interface LayoutReport {
  overflowPx: number;
  offenders: string[];
  smallTargets: string[];
  headerHeight: number;
}

/** Measures horizontal overflow, undersized tap targets and header height. */
async function audit(page: Page): Promise<LayoutReport> {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""} "${(el.textContent ?? "").trim().slice(0, 30)}"`;

    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Ignore content inside deliberately scrollable rows (chip strips, carousels).
      let scroller: Element | null = el.parentElement;
      let inScroller = false;
      while (scroller && scroller !== document.body) {
        const style = getComputedStyle(scroller);
        if (style.overflowX === "auto" || style.overflowX === "scroll" || style.overflowX === "hidden") {
          inScroller = true;
          break;
        }
        scroller = scroller.parentElement;
      }
      if (!inScroller && r.right > vw + 1) offenders.push(`${describe(el)} right=${Math.round(r.right)}`);
    }

    const smallTargets: string[] = [];
    for (const el of Array.from(document.querySelectorAll("button, select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, [role=button]"))) {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || style.visibility === "hidden" || el.classList.contains("sr-only")) continue;
      if (r.height < 32 || r.width < 32) smallTargets.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    }

    const header = document.querySelector("header");
    return {
      overflowPx: Math.max(0, document.documentElement.scrollWidth - vw),
      offenders: offenders.slice(0, 5),
      smallTargets: smallTargets.slice(0, 8),
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
    };
  });
}

async function check(page: Page, path: string, testInfo: { project: { name: string }; outputPath: (...p: string[]) => string }) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const report = await audit(page);
  const name = path.replace(/[/?=&]+/g, "_").replace(/^_/, "") || "home";
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });

  expect.soft(report.overflowPx, `${path}: page scrolls sideways; widest: ${report.offenders.join(" | ")}`).toBe(0);
  if (testInfo.project.name !== "desktop") {
    expect.soft(report.smallTargets, `${path}: tap targets under 32px`).toEqual([]);
  }
  // A page title squeezed into a sliver beside its actions is unreadable.
  const titleWidth = await page.evaluate(() => document.querySelector("[data-page-header] > div")?.getBoundingClientRect().width ?? null);
  if (titleWidth !== null) {
    const room = Math.min(320, (page.viewportSize()?.width ?? 0) - 32);
    expect.soft(titleWidth, `${path}: page title is squeezed`).toBeGreaterThanOrEqual(room);
  }
  if (testInfo.project.name === "duo-cover-landscape" && report.headerHeight > 0) {
    expect.soft(report.headerHeight, `${path}: header too tall for a landscape phone`).toBeLessThanOrEqual(56);
  }
}

test.describe("responsive layout", () => {
  test("public pages", async ({ page }, testInfo) => {
    for (const path of PUBLIC_PAGES) await check(page, path, testInfo);
  });

  test("signed-in and admin pages", async ({ page }, testInfo) => {
    await signInAs(page, "admin");
    for (const path of ADMIN_PAGES) await check(page, path, testInfo);
  });

  test("mobile menu works on phones", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, "the drawer is for narrow screens");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();

    // The panel must cover the full height of the screen, not sit inside the header bar.
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const panel = await drawer.getByRole("navigation", { name: "Menu" }).boundingBox();
    expect(panel?.y ?? -1).toBe(0);
    expect(panel?.height ?? 0).toBeGreaterThanOrEqual(viewport.height - 1);
    expect((panel?.x ?? 0) + (panel?.width ?? 0)).toBeLessThanOrEqual(viewport.width + 1);

    // Every destination is really on screen and is the thing a finger would hit.
    for (const name of ["Events", "News", "Vendors", "Leaderboard", "Shop"]) {
      const link = drawer.getByRole("link", { name, exact: true });
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeInViewport({ ratio: 1 });
      const onTop = await link.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit === el || el.contains(hit);
      });
      expect(onTop, `${name} is covered by something else`).toBe(true);
    }
    await expect(drawer.getByRole("button", { name: "Close menu" }).last()).toBeInViewport();

    await drawer.getByRole("link", { name: "Leaderboard" }).click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(drawer).toBeHidden();
  });
});
