import { expect, test, type Page } from "@playwright/test";
import { signInAs } from "./helpers";

/** Marks the named player as the winner of whichever match they're waiting in. */
async function win(page: Page, name: string) {
  await page.getByRole("button", { name: new RegExp(`^${name} won match`) }).click();
}

test.describe("event brackets", () => {
  test("staff seed players, run a top cut and send standings to results; players see it", async ({ browser }) => {
    const staff = await (await browser.newContext()).newPage();
    await signInAs(staff, "staff", "/admin/events/new");
    const title = `Bracket Night ${Date.now()}`;
    await staff.getByRole("textbox", { name: "Title", exact: true }).fill(title);
    await staff.getByLabel("Starts", { exact: true }).filter({ visible: true }).fill("2030-08-03T12:00");
    await staff.getByLabel("Status", { exact: true }).filter({ visible: true }).selectOption("published");
    await staff.getByRole("button", { name: "Create event" }).click();
    await expect(staff.getByRole("heading", { name: title })).toBeVisible();
    const slug = await staff.getByRole("textbox", { name: "URL", exact: true }).inputValue();

    await staff.getByRole("link", { name: "Bracket" }).click();
    // Nobody registered: add five players by name, in standings order.
    for (const name of ["Ash", "Misty", "Brock", "Gary", "Dawn"]) {
      await staff.getByRole("textbox", { name: "Add a player by name" }).fill(name);
      await staff.getByRole("button", { name: "Add", exact: true }).click();
    }
    const seeds = staff.getByRole("list", { name: "Seed order" }).getByRole("listitem");
    await expect(seeds).toHaveText([/1Ash/, /2Misty/, /3Brock/, /4Gary/, /5Dawn/]);

    // Reorder with the arrow buttons (the same list can be dragged by its handles).
    await staff.getByRole("button", { name: "Move Dawn up" }).click();
    await expect(seeds).toHaveText([/1Ash/, /2Misty/, /3Brock/, /4Dawn/, /5Gary/]);

    // Take the top 4 as the cut: the fifth player is left out.
    await staff.getByLabel("Who plays").selectOption({ label: "Top 4 only" });
    await expect(seeds.nth(4)).toContainText("Misses the cut");
    await staff.getByRole("button", { name: "Create bracket" }).click();

    // Standard seeding: 1 v 4 and 2 v 3.
    await expect(staff.getByRole("listitem", { name: "Match W1-1" })).toContainText("Ash");
    await expect(staff.getByRole("listitem", { name: "Match W1-1" })).toContainText("Dawn");
    await expect(staff.getByRole("listitem", { name: "Match W1-2" })).toContainText("Misty");
    await expect(staff.getByRole("listitem", { name: "Match W1-2" })).toContainText("Brock");

    await win(staff, "Ash");
    await win(staff, "Brock");
    const final = staff.getByRole("listitem", { name: "Match W2-1" });
    await expect(final).toContainText("Ash");
    await expect(final).toContainText("Brock");

    // A wrong tap can be undone, and the final empties again.
    await staff.getByRole("button", { name: "Undo result of match W1-2" }).click();
    await expect(final).not.toContainText("Brock");
    await win(staff, "Misty");
    await win(staff, "Misty");
    await expect(staff.getByRole("status").filter({ hasText: "Champion" })).toContainText("Misty");

    // Players see the same bracket on the event page, without controls.
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(`/events/${slug}`);
    await expect(visitor.getByRole("heading", { name: "Bracket", exact: true })).toBeVisible();
    await expect(visitor.getByRole("status").filter({ hasText: "Champion" })).toContainText("Misty");
    await expect(visitor.getByRole("button", { name: /won match|Undo/ })).toHaveCount(0);
    await visitor.context().close();

    // The finished bracket fills the results sheet in finishing order.
    await staff.getByRole("link", { name: "Results" }).click();
    await staff.getByRole("button", { name: "Fill from the bracket" }).click();
    const names = staff.getByRole("textbox", { name: "Player name" });
    await expect(names).toHaveCount(4);
    await expect(names.nth(0)).toHaveValue("Misty");
    await expect(names.nth(1)).toHaveValue("Ash");
    await expect(staff.getByRole("textbox", { name: "Placement" }).nth(2)).toHaveValue("3");
    await staff.context().close();
  });

  test("double elimination gives a second chance and can reset the final", async ({ browser }) => {
    const staff = await (await browser.newContext()).newPage();
    await signInAs(staff, "staff", "/admin/events/new");
    const title = `Losers Bracket Night ${Date.now()}`;
    await staff.getByRole("textbox", { name: "Title", exact: true }).fill(title);
    await staff.getByLabel("Starts", { exact: true }).filter({ visible: true }).fill("2030-08-04T12:00");
    await staff.getByRole("button", { name: "Create event" }).click();
    await expect(staff.getByRole("heading", { name: title })).toBeVisible();
    await staff.getByRole("link", { name: "Bracket" }).click();
    for (const name of ["Ash", "Misty", "Brock", "Gary"]) {
      await staff.getByRole("textbox", { name: "Add a player by name" }).fill(name);
      await staff.getByRole("button", { name: "Add", exact: true }).click();
    }
    await staff.getByRole("radio", { name: /Double elimination/ }).check();
    await staff.getByRole("button", { name: "Create bracket" }).click();
    await expect(staff.getByRole("region", { name: "Losers bracket" })).toBeVisible();

    await win(staff, "Ash"); // beats Gary
    await win(staff, "Misty"); // beats Brock
    await win(staff, "Ash"); // winners final: Misty drops down
    await expect(staff.getByRole("listitem", { name: "Match L1-1" })).toContainText("Gary");
    await win(staff, "Gary"); // Brock is out with two losses
    await win(staff, "Misty"); // losers final
    const grandFinal = staff.getByRole("listitem", { name: "Match GF1" });
    await expect(grandFinal).toContainText("Ash");
    await expect(grandFinal).toContainText("Misty");

    // Misty wins from the losers side, so both have one loss and the final resets.
    await win(staff, "Misty");
    await expect(staff.getByRole("heading", { name: "Grand final reset" })).toBeVisible();
    await expect(staff.getByRole("status").filter({ hasText: "Champion" })).toHaveCount(0);
    await win(staff, "Ash");
    await expect(staff.getByRole("status").filter({ hasText: "Champion" })).toContainText("Ash");
    await staff.context().close();
  });

  test("customers can't manage brackets", async ({ page }) => {
    await signInAs(page, "customer@mav.local");
    await page.goto("/admin/events");
    await expect(page).not.toHaveURL(/\/admin/);
  });
});
