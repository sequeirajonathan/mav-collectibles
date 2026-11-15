import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test.describe("staff requests", () => {
  test("staff ask, an admin finishes it, staff see the reply", async ({ browser }) => {
    const title = `Show store hours on event pages ${Date.now()}`;

    const staff = await (await browser.newContext()).newPage();
    await signInAs(staff, "staff@mav.local");
    await staff.goto("/admin/requests");
    const form = staff.locator("form").filter({ visible: true }).filter({ has: staff.getByRole("button", { name: "Send request" }) });
    await form.getByLabel("Title").fill(title);
    await form.getByLabel("Details").fill("People keep asking when we open on tournament days.");
    await form.getByRole("button", { name: "Send request" }).click();
    const mine = staff.getByRole("article").filter({ hasText: title }).filter({ visible: true });
    await expect(mine).toBeVisible();
    // Staff can't change status; only withdraw their own new request.
    await expect(mine.getByLabel("Status")).toHaveCount(0);
    await expect(mine.getByRole("button", { name: "Withdraw" })).toBeVisible();

    const admin = await (await browser.newContext()).newPage();
    await signInAs(admin, "admin@mav.local");
    await admin.goto("/admin/requests");
    const card = admin.getByRole("article").filter({ hasText: title }).filter({ visible: true });
    await card.getByLabel("Status").selectOption("done");
    await card.getByLabel("Reply").fill("Added under the event time.");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(admin.getByText("Saved")).toBeVisible();
    await expect(card).toHaveCount(0);

    await staff.goto("/admin/requests?view=done");
    const done = staff.getByRole("article").filter({ hasText: title }).filter({ visible: true });
    await expect(done).toContainText("Added under the event time.");
    await expect(done).toContainText("Done");

    // Finishing it posts an announcement in Team chat for everyone.
    await staff.goto("/admin/chat");
    const note = staff.getByText(new RegExp(`Request finished: .${title}`)).filter({ visible: true });
    await expect(note).toBeVisible();
    await expect(note).toContainText("Added under the event time.");

    await staff.context().close();
    await admin.context().close();
  });

  test("customers can't open the page", async ({ page }) => {
    await signInAs(page, "customer@mav.local");
    await page.goto("/admin/requests");
    await expect(page).not.toHaveURL(/\/admin/);
  });
});
