import { defineConfig, devices } from "@playwright/test";

/**
 * iPhone Duo sizes are derived from Apple's published pixel resolutions at 3x
 * (cover 1398×2034 px → 466×678 pt, inner 1878×2670 px → 626×890 pt).
 */
const phone = { isMobile: true, hasTouch: true, deviceScaleFactor: 3, browserName: "chromium" as const };
const executablePath = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "off",
    screenshot: "only-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    // Functional flows run once (desktop) because they change shared seed data;
    // every viewport runs the responsive sweep and the mobile menu check.
    { name: "duo-cover", use: { ...phone, viewport: { width: 466, height: 678 } }, testMatch: /responsive/ },
    { name: "duo-cover-landscape", use: { ...phone, viewport: { width: 678, height: 466 } }, testMatch: /responsive/ },
    { name: "duo-inner", use: { ...phone, viewport: { width: 626, height: 890 } }, testMatch: /responsive/ },
    { name: "duo-inner-landscape", use: { ...phone, viewport: { width: 890, height: 626 } }, testMatch: /responsive/ },
    { name: "iphone", use: { ...phone, viewport: { width: 393, height: 852 } }, testMatch: /responsive/ },
  ],
});
