import { expect, test } from "@playwright/test";

test.describe("installable app", () => {
  test("manifest and icons are valid", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as { display: string; start_url: string; icons: { src: string; sizes: string; purpose?: string }[] };
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toMatch(/^\//);
    expect(manifest.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
    expect((await request.get("/icons/apple-touch-icon.png")).ok()).toBe(true);
  });

  test("works as an app: service worker, then an offline page instead of a browser error", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    // Wait until the service worker controls the page.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
      }
    });

    await context.setOffline(true);
    try {
      await page.goto("/events");
      await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Events & tournaments" })).toBeVisible();
  });
});
