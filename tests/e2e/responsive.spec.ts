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
  "/product/FIXTURE_ITEM_1",
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
    await drawer.getByRole("link", { name: "Leaderboard" }).click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(drawer).toBeHidden();
  });
});
