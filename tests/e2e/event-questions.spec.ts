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
    // One tap adds the same questions the shop's Google Form asked.
    await staff.getByRole("button", { name: "Pokémon tournament" }).click();
    await expect(staff.getByRole("textbox", { name: "Question 1" })).toHaveValue("Player ID");
    await expect(staff.getByRole("textbox", { name: "Question 2" })).toHaveValue("Date of birth (month and year)");
    await expect(staff.getByRole("textbox", { name: "Question 4" })).toHaveValue("Deck list (image or PDF)");
    await staff.getByLabel("Status", { exact: true }).filter({ visible: true }).selectOption("published");
    await staff.getByRole("button", { name: "Create event" }).click();
    await expect(staff.getByRole("heading", { name: title })).toBeVisible();
    // The questions were saved with the event.
    await expect(staff.getByRole("textbox", { name: "Question 3" })).toHaveValue("Deck list (copy and paste)");
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
    await form.getByRole("textbox", { name: "Player ID" }).fill("7654321");
    await form.getByRole("combobox", { name: "Month" }).selectOption("March");
    await form.getByRole("combobox", { name: "Year" }).selectOption("2011");
    await form.getByRole("textbox", { name: "Deck list (copy and paste) (optional)" }).fill("4 Pikachu ex SSP 57\n2 Raichu SSP 58");
    // The deck list photo or PDF goes to private storage.
    await form.getByLabel("Deck list (image or PDF) (optional)").setInputFiles("tests/fixtures/files/resume.pdf");
    await expect(form.getByText("resume.pdf")).toBeVisible();
    await form.getByRole("button", { name: "Confirm RSVP" }).click();
    await expect(player.getByText("You're going", { exact: true }).filter({ visible: true })).toBeVisible();

    // Answers are kept: reopening shows them, and they can be changed.
    await player.reload();
    await player.getByRole("button", { name: "Edit my details" }).click();
    const edit = player.getByRole("form", { name: "Player details" });
    await expect(edit.getByRole("combobox", { name: "Month" })).toHaveValue("03");
    await expect(edit.getByText("File uploaded")).toBeVisible();
    await edit.getByRole("textbox", { name: "Player ID" }).fill("7654322");
    await edit.getByRole("button", { name: "Save my details" }).click();
    await expect(player.getByText("You're going", { exact: true }).filter({ visible: true })).toBeVisible();

    // The Player ID they typed is now on their profile, ready for the next event.
    await player.goto("/profile");
    await expect(player.getByRole("textbox", { name: "Pokémon Player ID (optional)" })).toHaveValue("7654322");
    // They gave a 2011 birth date: a minor's is never copied to the profile.
    await expect(player.getByText(/We remember your birth month/)).toHaveCount(0);

    await staff.goto(adminUrl);
    await staff.getByRole("link", { name: "Check-in" }).click();
    // Staff can find a player by something they answered, not just their account name.
    await staff.getByPlaceholder("Find a player").fill("7654322");
    const row = staff.getByRole("listitem").filter({ hasText: "customer@mav.local" }).filter({ visible: true });
    await expect(row).toContainText("7654322");
    await expect(row).toContainText("Mar 2011");
    await expect(row).toContainText("4 Pikachu ex SSP 57");
    // Staff open the uploaded deck list through a short-lived private link.
    // (A headless browser downloads a PDF instead of showing it, so check the link itself, not the new tab.)
    const signed = staff.context().waitForEvent("request", (r) => /\/storage\/v1\/object\/sign\/event-uploads\//.test(r.url()));
    await row.getByRole("button", { name: "View file" }).click();
    const fileResponse = await staff.request.get((await signed).url());
    expect(fileResponse.status()).toBe(200);
    expect(fileResponse.headers()["content-type"]).toContain("pdf");
    // Without the signature, the file is not readable.
    const unsigned = await staff.request.get(fileResponse.url().split("?")[0] ?? "");
    expect(unsigned.status()).toBeGreaterThanOrEqual(400);
    const download = staff.waitForEvent("download");
    await staff.getByRole("button", { name: "Download spreadsheet" }).click();
    expect((await download).suggestedFilename()).toBe(`${slug}-players.csv`);

    // A second event that asks for the Player ID has it filled in already.
    await staff.goto("/admin/events/new");
    const second = `Second Cup ${Date.now()}`;
    await staff.getByRole("textbox", { name: "Title", exact: true }).fill(second);
    await staff.getByLabel("Starts", { exact: true }).filter({ visible: true }).fill("2030-07-13T12:15");
    await staff.getByRole("button", { name: "Pokémon tournament" }).click();
    await staff.getByLabel("Status", { exact: true }).filter({ visible: true }).selectOption("published");
    await staff.getByRole("button", { name: "Create event" }).click();
    await expect(staff.getByRole("heading", { name: second })).toBeVisible();
    const secondSlug = await staff.getByRole("textbox", { name: "URL", exact: true }).inputValue();
    await player.goto(`/events/${secondSlug}?rsvp=1`);
    const next = player.getByRole("form", { name: "Player details" });
    await expect(next.getByRole("textbox", { name: "Player ID" })).toHaveValue("7654322");
    await expect(next.getByText("Filled in from your profile.")).toBeVisible();

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
