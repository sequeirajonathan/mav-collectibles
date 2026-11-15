import { expect, test, type Page } from "@playwright/test";
import { signInAs } from "./helpers";

async function setVendorsVisible(admin: Page, visible: boolean) {
  await admin.goto("/admin/site");
  const toggle = admin.getByRole("switch", { name: "Show vendors" }).filter({ visible: true });
  if (((await toggle.getAttribute("aria-checked")) === "true") !== visible) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", String(visible));
  }
}

test.describe("vendors switch", () => {
  test("turning vendors off removes the pages and every link to them", async ({ browser }) => {
    const admin = await (await browser.newContext()).newPage();
    await signInAs(admin, "admin@mav.local");
    try {
      await setVendorsVisible(admin, false);

      const visitor = await (await browser.newContext()).newPage();
      await visitor.goto("/");
      await expect(visitor.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Events" })).toBeVisible();
      await expect(visitor.locator('a[href^="/vendors"]')).toHaveCount(0);
      await expect(visitor.getByRole("heading", { name: "Sell or trade at MAV" })).toHaveCount(0);
      for (const path of ["/vendors", "/vendors/lone-star-slabs"]) {
        await visitor.goto(path);
        await expect(visitor.getByText(/page not found/i).filter({ visible: true })).toBeVisible();
      }
      await visitor.goto("/events/vendor-day");
      await expect(visitor.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(visitor.getByRole("heading", { name: "Vendors at this event" })).toHaveCount(0);
      expect(await (await visitor.request.get("/sitemap.xml")).text()).not.toContain("/vendors");
      await visitor.context().close();

      // Signed-in people can't reach the application form either.
      const customer = await (await browser.newContext()).newPage();
      await signInAs(customer, "customer@mav.local");
      await customer.goto("/vendors/apply");
      await expect(customer.getByText(/page not found/i).filter({ visible: true })).toBeVisible();
      await customer.context().close();

      // Staff keep the admin tools.
      await admin.goto("/admin/vendors");
      await expect(admin.getByRole("heading", { level: 1 })).toBeVisible();
    } finally {
      await setVendorsVisible(admin, true);
    }

    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto("/vendors");
    await expect(visitor.getByRole("heading", { name: "Vendor directory" })).toBeVisible();
    await expect(visitor.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Vendors" })).toBeVisible();
    await visitor.context().close();
    await admin.context().close();
  });
});
