import { expect, test } from "@playwright/test";

test.describe("search engines", () => {
  test("robots and sitemap are served to anyone", async ({ request }) => {
    const robots = await request.get("/robots.txt", { maxRedirects: 0 });
    expect(robots.status()).toBe(200);
    const rules = await robots.text();
    expect(rules).toContain("Sitemap:");
    expect(rules).toContain("Disallow: /admin");

    const sitemap = await request.get("/sitemap.xml", { maxRedirects: 0 });
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    for (const path of ["/events", "/pokemon-cards-montgomery-tx", "/sell-your-cards", "/visit", "/events/pokemon-league-night"]) {
      expect(xml, path).toContain(`${path}</loc>`);
    }
    // Private and hidden pages stay out.
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("draft-event");
  });

  test("pages describe the shop and its events in a form search engines read", async ({ page }) => {
    const data = async () => {
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      return blocks.map((b) => JSON.parse(b) as Record<string, unknown>);
    };

    await page.goto("/");
    const store = (await data()).find((d) => JSON.stringify(d["@type"]).includes("Store"));
    expect(store?.name).toBe("MAV Collectibles");
    expect(JSON.stringify(store?.address)).toContain("Montgomery");
    expect(store?.openingHoursSpecification).toBeTruthy();
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og\.png/);

    await page.goto("/events/pokemon-league-night");
    const event = (await data()).find((d) => d["@type"] === "Event");
    expect(event?.name).toBe("Pokémon League Night");
    expect(event?.startDate).toBeTruthy();

    for (const [path, heading] of [
      ["/pokemon-cards-montgomery-tx", /Pokémon cards in/],
      ["/sell-your-cards", /Sell your cards/],
      ["/visit", /Come see us/],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading }).filter({ visible: true })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
    }
  });
});

test("singles link points at the TCGplayer store", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[href="https://mavcollectibles.tcgplayerpro.com/"]');
  await expect(links.filter({ hasText: "Shop singles on TCGplayer" })).toBeVisible();
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (const link of await links.all()) await expect(link).toHaveAttribute("target", "_blank");
});
