import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test.describe("event sign-up questions", () => {
  test("staff ask questions, a player answers at RSVP, staff see the answers", async ({ browser }) => {
    const staff = await (await browser.newContext()).newPage();
    await signInAs(staff, "staff", "/admin/events/new");
    const title = `Season Cup ${Date.now()}`;
    await staff.getByRole("textbox", { name: "Title", exact: true }).fill(title);
    await staff.getByLabel("Starts", { exact: true }).filter({ visible: true }).fill("2030-07-06T12:15");
    // A blank question is caught with a message that says which one.
    await staff.getByRole("button", { name: "Add a question" }).click();
    await staff.getByRole("button", { name: "Create event" }).click();
    await expect(staff.getByRole("alert").filter({ hasText: "Question 1: Write the question" })).toBeVisible();
    await staff.getByRole("button", { name: "Remove question 1" }).click();
    await staff.getByRole("button", { name: "Pokémon player info" }).click();
    await expect(staff.getByRole("textbox", { name: "Question 1" })).toHaveValue("Player name");
    await expect(staff.getByRole("textbox", { name: "Question 3" })).toHaveValue("Date of birth");
    await staff.getByLabel("Status", { exact: true }).filter({ visible: true }).selectOption("published");
    await staff.getByRole("button", { name: "Create event" }).click();
    await expect(staff.getByRole("heading", { name: title })).toBeVisible();
    // The questions were saved with the event.
    await expect(staff.getByRole("textbox", { name: "Question 2" })).toHaveValue("Player ID");
    const slug = await staff.getByRole("textbox", { name: "URL", exact: true }).inputValue();
    const adminUrl = staff.url();

    // Organizers hand out a sign-up link; it opens the event with the form ready.
    await expect(staff.getByRole("button", { name: "Copy sign-up link" })).toBeVisible();
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(`/events/${slug}?rsvp=1`);
    await expect(visitor.getByRole("link", { name: "Sign in to RSVP" })).toHaveAttribute("href", `/sign-in?next=${encodeURIComponent(`/events/${slug}?rsvp=1`)}`);
    await visitor.context().close();

    const player = await (await browser.newContext()).newPage();
    await signInAs(player, "customer@mav.local");
    await player.goto(`/events/${slug}?rsvp=1`);
    const form = player.getByRole("form", { name: "Player details" });
    await expect(form).toBeVisible();
    // Required answers are enforced before a spot is taken.
    await form.getByRole("button", { name: "Confirm RSVP" }).click();
    await expect(form.getByRole("alert").first()).toHaveText("Please answer this");
    await form.getByRole("textbox", { name: "Player name" }).fill("Misty Waterflower");
    await form.getByRole("textbox", { name: "Player ID (optional)" }).fill("7654321");
    await form.getByLabel("Date of birth").fill("2011-03-14");
    await form.getByRole("button", { name: "Confirm RSVP" }).click();
    await expect(player.getByText("You're going", { exact: true }).filter({ visible: true })).toBeVisible();

    // Answers are kept: reopening shows them, and they can be changed.
    await player.reload();
    await player.getByRole("button", { name: "Edit my details" }).click();
    const edit = player.getByRole("form", { name: "Player details" });
    await expect(edit.getByRole("textbox", { name: "Player name" })).toHaveValue("Misty Waterflower");
    await edit.getByRole("textbox", { name: "Player ID (optional)" }).fill("7654322");
    await edit.getByRole("button", { name: "Save my details" }).click();
    await expect(player.getByText("You're going", { exact: true }).filter({ visible: true })).toBeVisible();

    await staff.goto(adminUrl);
    await staff.getByRole("link", { name: "Check-in" }).click();
    // Staff can find a player by the name they gave, not just their account name.
    await staff.getByPlaceholder("Find a player").fill("misty");
    const row = staff.getByRole("listitem").filter({ hasText: "Misty Waterflower" }).filter({ visible: true });
    await expect(row).toContainText("7654322");
    await expect(row).toContainText("2011-03-14");
    const download = staff.waitForEvent("download");
    await staff.getByRole("button", { name: "Download spreadsheet" }).click();
    expect((await download).suggestedFilename()).toBe(`${slug}-players.csv`);

    await player.context().close();
    await staff.context().close();
  });

  test("the guide shows staff what they can do, without admin-only topics", async ({ browser }) => {
    const staff = await (await browser.newContext()).newPage();
    await signInAs(staff, "staff@mav.local", "/admin/guide");
    await expect(staff.getByRole("heading", { name: "Share the sign-up link" })).toBeVisible();
    await expect(staff.getByRole("heading", { name: "Job applications" })).toBeVisible();
    await expect(staff.getByRole("heading", { name: "Give someone access" })).toHaveCount(0);
    await staff.context().close();

    const admin = await (await browser.newContext()).newPage();
    await signInAs(admin, "admin@mav.local", "/admin/guide");
    await expect(admin.getByRole("heading", { name: "Give someone access" })).toBeVisible();
    await admin.context().close();
  });
});
