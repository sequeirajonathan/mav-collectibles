import { expect, test, type Page } from "@playwright/test";
import { signInAs } from "./helpers";

async function setShopVisible(admin: Page, visible: boolean) {
  await admin.goto("/admin/site");
  const toggle = admin.getByRole("switch", { name: "Show the shop to customers" }).filter({ visible: true });
  if (((await toggle.getAttribute("aria-checked")) === "true") !== visible) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", String(visible));
  }
}

test.describe("hidden shop", () => {
  test("only admins and staff can open the shop while it's hidden", async ({ browser }) => {
    const admin = await (await browser.newContext()).newPage();
    await signInAs(admin, "admin@mav.local");
    try {
      await setShopVisible(admin, false);

      // A visitor: no links, a coming-soon note on every shop page, no catalog data.
      const visitor = await (await browser.newContext()).newPage();
      await visitor.goto("/");
      await expect(visitor.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Events" })).toBeVisible();
      await expect(visitor.getByRole("link", { name: "Shop", exact: true }).filter({ visible: true })).toHaveCount(0);
      await expect(visitor.getByRole("heading", { name: "Choose your game" }).filter({ visible: true })).toHaveCount(0);
      for (const path of ["/shop", "/category/pokemon?group=TCG", "/search?q=pikachu"]) {
        await visitor.goto(path);
        await expect(visitor.getByRole("heading", { name: "The online shop is on its way" }).filter({ visible: true })).toBeVisible();
        await expect(visitor.getByText("Browse the shelves").filter({ visible: true })).toHaveCount(0);
      }
      expect((await visitor.request.get("/api/v1/catalog/category/pokemon?group=TCG")).status()).toBe(404);
      expect((await visitor.request.get("/api/v1/catalog/search?query=pikachu")).status()).toBe(404);
      expect(await (await visitor.request.get("/sitemap.xml")).text()).not.toContain("/category/");

      // A signed-in customer is treated the same.
      const customer = await (await browser.newContext()).newPage();
      await signInAs(customer, "customer@mav.local");
      await customer.goto("/shop");
      await expect(customer.getByRole("heading", { name: "The online shop is on its way" }).filter({ visible: true })).toBeVisible();
      expect((await customer.request.get("/api/v1/catalog/category/pokemon?group=TCG")).status()).toBe(404);

      // Staff still see the shop, with a reminder that customers can't.
      const staff = await (await browser.newContext()).newPage();
      await signInAs(staff, "staff@mav.local");
      await staff.goto("/shop");
      await expect(staff.getByRole("heading", { name: "Browse the shelves" }).filter({ visible: true })).toBeVisible();
      await expect(staff.getByText(/the shop is hidden from customers/i).filter({ visible: true })).toBeVisible();
      await expect(staff.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Shop", exact: true })).toBeVisible();
      expect((await staff.request.get("/api/v1/catalog/category/pokemon?group=TCG")).status()).toBe(200);

      for (const p of [visitor, customer, staff]) await p.context().close();
    } finally {
      await setShopVisible(admin, true);
      await admin.context().close();
    }
  });
});
