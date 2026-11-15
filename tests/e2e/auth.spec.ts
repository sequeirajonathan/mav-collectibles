import { expect, test } from "@playwright/test";
import { emailLink, signIn, signInAs } from "./helpers";

test.describe("authentication", () => {
  test("username sign-in and role gating", async ({ page }) => {
    await signInAs(page, "customer");
    for (const [method, path] of [
      ["POST", "/api/v1/print-jobs"],
      ["GET", "/api/v1/print-jobs"],
    ] as const) {
      const r = await page.request.fetch(path, { method, data: method === "POST" ? {} : undefined });
      expect(r.status(), `${method} ${path}`).toBe(403);
    }
    await page.goto("/admin");
    await expect(page).toHaveURL((u) => u.pathname === "/");
  });

  test("the same generic error for a wrong password and an unknown user", async ({ page }) => {
    const formError = page.getByRole("alert").filter({ hasText: /\S/ });
    await signIn(page, "customer", "wrong-password");
    await expect(formError).toHaveText("Invalid email/username or password.");
    await signIn(page, "nobody-here", "whatever123");
    await expect(formError).toHaveText("Invalid email/username or password.");
  });

  test("ignores off-site redirect targets", async ({ page }) => {
    await signIn(page, "customer", "password123", "//evil.example.com");
    await expect(page).toHaveURL((u) => u.host === new URL(page.url()).host && u.pathname === "/dashboard");
  });

  test("sign-up with email confirmation, then password reset", async ({ page, browser }) => {
    const email = `new${Date.now()}@example.com`;
    await page.goto("/sign-up");
    const form = page.locator("main form");
    await form.getByLabel("Username").fill("customer");
    await form.getByLabel("Email").fill(email);
    await form.getByLabel("Phone Number (US Only)").fill("5555550199");
    await form.getByLabel("Password", { exact: true }).fill("supersecret1");
    await form.getByLabel("Confirm Password").fill("supersecret1");
    await form.getByRole("button", { name: "Sign Up" }).click();
    await expect(page.getByText("That username is taken").filter({ visible: true }).first()).toBeVisible();

    await form.getByLabel("Username").fill(`newbie${Date.now() % 100000}`);
    await form.getByRole("button", { name: "Sign Up" }).click();
    await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();

    const confirm = await emailLink(email);
    await page.goto(confirm.link);
    await expect(page).toHaveURL(/\/dashboard$/);

    const fresh = await browser.newPage();
    await fresh.goto("/forgot-password");
    await fresh.getByLabel("Email").fill(email);
    await fresh.getByRole("button", { name: "Send reset link" }).click();
    await expect(fresh.getByText(/If an account exists/).filter({ visible: true })).toBeVisible();
    const reset = await emailLink(email, confirm.id);
    await fresh.goto(reset.link);
    await expect(fresh).toHaveURL(/\/reset-password$/);
    await fresh.getByLabel("New password").fill("brandnewpass2");
    await fresh.getByLabel("Confirm password").fill("brandnewpass2");
    await fresh.getByRole("button", { name: "Update password" }).click();
    await expect(fresh).toHaveURL(/\/dashboard$/);
    await fresh.close();
  });
});
