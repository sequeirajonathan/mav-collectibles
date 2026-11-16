import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test.describe("service keys", () => {
  test("an admin saves a key, it is never shown back, and it can be removed", async ({ page }) => {
    await signInAs(page, "admin@mav.local", "/admin/site");
    const section = page.getByRole("region", { name: "Service keys" });
    const row = section.getByRole("listitem").filter({ hasText: "Discord announcements" });
    await expect(row).toContainText("Not set");

    // A value that isn't a webhook address is refused with a hint.
    const input = row.getByLabel("Paste the key");
    await input.fill("hello");
    await row.getByRole("button", { name: "Save" }).click();
    await expect(row.getByRole("status")).toContainText("Starts with https://discord.com/api/webhooks/");

    const secret = "https://discord.com/api/webhooks/123456789012345678/e2e-secret-value-abcdefghijklmnop";
    await input.fill(secret);
    await row.getByRole("button", { name: "Save" }).click();
    await expect(row).toContainText("Saved here");
    await expect(row.getByLabel("Replace the key")).toHaveValue("");

    // Reloading shows it is set, without the value anywhere in the page.
    await page.reload();
    await expect(page.getByRole("region", { name: "Service keys" }).getByRole("listitem").filter({ hasText: "Discord announcements" })).toContainText("Saved here");
    expect(await page.content()).not.toContain("e2e-secret-value");

    const again = page.getByRole("region", { name: "Service keys" }).getByRole("listitem").filter({ hasText: "Discord announcements" });
    await again.getByRole("button", { name: "Remove" }).click();
    await again.getByRole("button", { name: "Remove key" }).click();
    await expect(again).toContainText("Not set");
  });

  test("staff can't reach the keys", async ({ page }) => {
    await signInAs(page, "staff@mav.local");
    await page.goto("/admin/site");
    await expect(page).not.toHaveURL(/\/admin\/site/);
  });
});
