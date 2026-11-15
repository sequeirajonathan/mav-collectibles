import path from "node:path";
import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

const RESUME = path.join(__dirname, "../fixtures/files/resume.pdf");

test.describe("job applications", () => {
  test("someone applies with a résumé; staff review it and open the file", async ({ page, browser }) => {
    const name = `Brock Harrison ${Date.now()}`;
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: /hiring/i }).first()).toBeVisible();
    const form = page.locator("form").filter({ visible: true }).filter({ has: page.getByRole("button", { name: "Send application" }) });
    await form.getByLabel("Full name").fill(name);
    await form.getByLabel("Email").fill(`brock-${Date.now()}@example.com`);
    await form.getByLabel("Tell us about yourself").fill("Ran a Pokémon league for two years.");
    await form.getByLabel(/Résumé/).setInputFiles(RESUME);
    await form.getByRole("button", { name: "Send application" }).click();
    await expect(page.getByText("Application sent").filter({ visible: true })).toBeVisible();

    const staff = await (await browser.newContext()).newPage();
    await signInAs(staff, "staff@mav.local");
    await staff.goto("/admin/applications");
    const card = staff.getByRole("article").filter({ hasText: name }).filter({ visible: true });
    await expect(card).toContainText("TCGplayer Specialist");
    // Staff can't delete; only admins can.
    await expect(card.getByRole("button", { name: "Delete" })).toHaveCount(0);

    // The résumé is served only to signed-in reviewers, as a download of the original file.
    const href = await card.getByRole("link", { name: "Open résumé" }).getAttribute("href");
    expect(href).toBeTruthy();
    const file = await staff.request.get(href ?? "");
    expect(file.status()).toBe(200);
    expect((await file.body()).subarray(0, 4).toString()).toBe("%PDF");
    const anonymous = await page.request.get(href ?? "", { maxRedirects: 0 });
    expect([401, 403]).toContain(anonymous.status());

    await card.getByLabel("Status").selectOption("interview");
    await card.getByLabel("Notes").fill("Call Tuesday.");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(staff.getByText("Saved")).toBeVisible();
    await staff.goto("/admin/applications?status=interview");
    await expect(staff.getByRole("article").filter({ hasText: name }).filter({ visible: true })).toContainText("Call Tuesday.");
    await staff.context().close();
  });

  test("a file that isn't a document is refused", async ({ request }) => {
    const response = await request.post("/api/v1/job-applications", {
      multipart: {
        position: "TCGplayer Specialist",
        name: "Test Person",
        email: `bad-${Date.now()}@example.com`,
        resume: { name: "resume.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
      },
    });
    expect(response.status()).toBe(400);
  });
});
