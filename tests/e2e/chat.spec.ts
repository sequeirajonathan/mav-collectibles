import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

// A 1×1 PNG.
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

test.describe("staff chat", () => {
  test("staff and admin talk, share a picture, and customers are kept out", async ({ browser }) => {
    const text = `Slab case is restocked ${Date.now()}`;

    const staff = await (await browser.newContext()).newPage();
    await signInAs(staff, "staff@mav.local");
    await staff.goto("/admin/chat");
    const composer = staff.locator("form").filter({ visible: true }).filter({ has: staff.getByRole("button", { name: "Send" }) });
    await composer.getByLabel("Message").fill(text);
    await composer.locator('input[type="file"]').setInputFiles({ name: "case.png", mimeType: "image/png", buffer: PIXEL });
    await composer.getByRole("button", { name: "Send" }).click();
    const log = staff.getByRole("log").filter({ visible: true });
    await expect(log.getByText(text)).toBeVisible();
    const image = log.getByRole("img", { name: "Picture" }).last();
    await expect(image).toBeVisible();

    // The admin sees it without reloading (the page checks for new messages).
    const admin = await (await browser.newContext()).newPage();
    await signInAs(admin, "admin@mav.local");
    await admin.goto("/admin/chat");
    const adminLog = admin.getByRole("log").filter({ visible: true });
    await expect(adminLog.getByText(text)).toBeVisible();
    const reply = `On it ${Date.now()}`;
    const adminComposer = admin.locator("form").filter({ visible: true }).filter({ has: admin.getByRole("button", { name: "Send" }) });
    await adminComposer.getByLabel("Message").fill(reply);
    await adminComposer.getByLabel("Message").press("Enter");
    await expect(log.getByText(reply)).toBeVisible({ timeout: 15_000 });

    // Pictures are only served to staff.
    const src = await image.getAttribute("src");
    expect((await staff.request.get(src ?? "")).status()).toBe(200);
    const customer = await (await browser.newContext()).newPage();
    await signInAs(customer, "customer@mav.local");
    expect((await customer.request.get(src ?? "", { maxRedirects: 0 })).status()).toBe(403);
    expect((await customer.request.get("/api/v1/staff-chat")).status()).toBe(403);
    await customer.goto("/admin/chat");
    await expect(customer).not.toHaveURL(/\/admin/);

    for (const p of [staff, admin, customer]) await p.context().close();
  });
});
