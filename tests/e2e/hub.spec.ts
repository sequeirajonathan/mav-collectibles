import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test.describe("event hub", () => {
  test("public pages show seeded content and hide drafts", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("link", { name: /Pokémon League Night/ }).first()).toBeVisible();
    await expect(page.getByText("Draft event (hidden)", { exact: true }).filter({ visible: true })).toHaveCount(0);

    await page.goto("/events?game=one-piece");
    await expect(page.getByRole("heading", { name: "One Piece Casual Night" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pokémon League Night" })).toHaveCount(0);

    await page.goto("/events/draft-event");
    await expect(page.getByText(/could not be found|not found/i).filter({ visible: true }).first()).toBeVisible();

    await page.goto("/vendors");
    await expect(page.getByRole("heading", { name: "Lone Star Slabs" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pending Vendor Co" })).toHaveCount(0);

    await page.goto("/leaderboard");
    // Phones get a list, wider screens a table: assert whichever is shown.
    await expect(page.getByText("Ash K.").filter({ visible: true })).toBeVisible();
  });

  test("RSVP, cancel, and waitlist when full", async ({ page }) => {
    await signInAs(page, "customer", "/events/pokemon-prerelease");
    await expect(page.getByText("Full · waitlist open", { exact: true }).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(page.getByText("On the waitlist", { exact: true }).filter({ visible: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("On the waitlist", { exact: true }).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: "Cancel RSVP" }).click();
    await page.getByRole("button", { name: "Yes, cancel" }).click();
    await expect(page.getByRole("button", { name: "Join the waitlist" })).toBeVisible();

    await page.goto("/events/one-piece-casual");
    await page.getByRole("button", { name: "RSVP" }).click();
    await expect(page.getByText("You're going", { exact: true }).filter({ visible: true })).toBeVisible();
    // The button updates at once; wait for the save to be confirmed before leaving the page.
    await expect(page.getByText("You're in! See you there.")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "One Piece Casual Night" })).toBeVisible();
  });

  test("calendar export", async ({ request }) => {
    const ics = await request.get("/events/pokemon-league-night/calendar.ics");
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    expect(await ics.text()).toContain("SUMMARY:Pokémon League Night");
    const feed = await (await request.get("/events/calendar.ics")).text();
    expect(feed).toContain("X-WR-CALNAME:MAV Collectibles Events");
    expect(feed).not.toContain("Draft event");
  });

  test("like, save and comment on a post", async ({ page }) => {
    await signInAs(page, "staff", "/feed");
    const post = page.locator("article").filter({ hasText: "New arrivals this week" });
    const like = post.getByRole("button", { name: /likes/ });
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "true");
    await post.getByRole("button", { name: "Save" }).click();
    await expect(post.getByRole("button", { name: "Saved" })).toBeVisible();

    await post.getByRole("link", { name: "New arrivals this week" }).click();
    const text = `Can't wait ${Date.now()}`;
    await page.getByRole("textbox", { name: "Write a comment", exact: true }).fill(text);
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(page.getByText(text).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: "Delete comment" }).last().click();
    await expect(page.getByText(text).filter({ visible: true })).toHaveCount(0);

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "New arrivals this week" })).toBeVisible();
  });

  test("vendor applies; staff approve and confirm a table", async ({ page }) => {
    await signInAs(page, "customer", "/vendors/apply");
    await page.getByRole("textbox", { name: "Shop or vendor name", exact: true }).fill("Customer Cards");
    await page.getByRole("textbox", { name: "Contact email", exact: true }).fill("customer@mav.local");
    const vendorDay = await page.locator("option", { hasText: "Vendor & Trade Day" }).getAttribute("value");
    await page.getByLabel("Request a table at", { exact: true }).filter({ visible: true }).selectOption(vendorDay ?? "");
    await page.getByRole("button", { name: "Send application" }).click();
    await expect(page.getByText("Application received", { exact: true }).filter({ visible: true })).toBeVisible();

    await page.context().clearCookies();
    await signInAs(page, "staff", "/admin/vendors");
    const card = page.locator("article").filter({ hasText: "Customer Cards" });
    await card.getByRole("button", { name: "Approve" }).click();
    await card.getByPlaceholder("Table #").fill("7");
    await card.getByRole("button", { name: "Confirm" }).click();
    await expect(card.getByText("confirmed")).toBeVisible();

    await page.goto("/events/vendor-day");
    await expect(page.getByText("Customer Cards", { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Table 7", { exact: true }).filter({ visible: true })).toBeVisible();
  });

  test("staff run an event: create, publish, check in, post results", async ({ page }) => {
    await signInAs(page, "staff", "/admin/events/new");
    const title = `Friday Night Fights ${Date.now()}`;
    await page.getByRole("textbox", { name: "Title", exact: true }).fill(title);
    await page.getByLabel("Starts", { exact: true }).filter({ visible: true }).fill("2030-06-07T18:00");
    await page.getByRole("spinbutton", { name: "Capacity", exact: true }).fill("16");
    await page.getByRole("textbox", { name: "Link (optional)" }).fill("https://forms.gle/example123");
    await page.getByRole("textbox", { name: "Button text" }).fill("Deck list form");
    await page.getByRole("textbox", { name: "Details" }).fill("Rules are at https://example.com/rules. Bring sleeves.");
    await page.getByLabel("Status", { exact: true }).filter({ visible: true }).selectOption("published");
    await page.getByRole("button", { name: "Create event" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    const slug = await page.getByRole("textbox", { name: "URL", exact: true }).inputValue();

    const adminUrl = page.url();
    await page.goto(`/events/${slug}`);
    await expect(page.getByText("Fri, Jun 7 · 6:00 PM", { exact: true }).filter({ visible: true }).first()).toBeVisible();
    // The pasted form link is a button, and addresses in the details are clickable.
    const formLink = page.getByRole("link", { name: "Deck list form" });
    await expect(formLink).toHaveAttribute("href", "https://forms.gle/example123");
    await expect(formLink).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "https://example.com/rules", exact: true })).toHaveAttribute("href", "https://example.com/rules");
    await page.getByRole("button", { name: "RSVP" }).click();
    await expect(page.getByText("You're going", { exact: true }).filter({ visible: true })).toBeVisible();

    await page.goto(adminUrl);
    await page.getByRole("link", { name: "Check-in" }).click();
    await page.getByRole("button", { name: /Check in staff/ }).click();
    await expect(page.getByText(/1 of 1 checked in/).filter({ visible: true })).toBeVisible();

    await page.getByRole("link", { name: "Results" }).click();
    await page.getByRole("button", { name: /Fill from 1 checked-in/ }).click();
    await page.getByRole("button", { name: "Save results" }).click();
    await expect(page.getByText(/Saved 1 results/).filter({ visible: true })).toBeVisible();
  });

  test("admin-only site settings", async ({ page }) => {
    await signInAs(page, "staff", "/admin");
    await expect(page.getByRole("link", { name: "Site" })).toHaveCount(0);
    await page.goto("/admin/site");
    await expect(page).toHaveURL((u) => u.pathname === "/");
  });
});
