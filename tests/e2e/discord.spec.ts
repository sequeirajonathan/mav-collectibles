import { generateKeyPairSync, sign } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { signInAs } from "./helpers";

test.describe("Discord bot", () => {
  test("requests without Discord's signature are refused", async ({ request }) => {
    const unsigned = await request.post("/api/discord/interactions", { data: { type: 1 } });
    expect(unsigned.status()).toBe(401);
    const forged = await request.post("/api/discord/interactions", {
      data: { type: 2, data: { name: "events" } },
      headers: { "x-signature-ed25519": "ab".repeat(64), "x-signature-timestamp": "1700000000" },
    });
    expect(forged.status()).toBe(401);
  });

  test("an admin saves the bot's settings; bad IDs are explained", async ({ page }) => {
    await signInAs(page, "admin@mav.local", "/admin/site");
    const section = page.getByRole("region", { name: "Discord bot" });
    await expect(section.getByText("/api/discord/interactions")).toBeVisible();
    // Nothing can be registered or tested until the bot is connected.
    await expect(section.getByRole("button", { name: "Register slash commands" })).toBeDisabled();

    await section.getByLabel("Application ID").fill("not-a-number");
    await section.getByRole("button", { name: "Save Discord settings" }).click();
    await expect(section.getByRole("alert").first()).toContainText("long number");

    await section.getByLabel("Application ID").fill("123456789012345678");
    await section.getByLabel("Server ID").fill("223456789012345678");
    await section.getByLabel("Public Key").fill("AB".repeat(32));
    await section.getByLabel("Announcements channel ID").fill("323456789012345678");
    await section.getByRole("checkbox", { name: /Day-before reminders/ }).uncheck();
    await section.getByRole("button", { name: "Save Discord settings" }).click();
    await expect(page.getByText("Discord settings saved")).toBeVisible();

    await page.reload();
    const again = page.getByRole("region", { name: "Discord bot" });
    await expect(again.getByLabel("Application ID")).toHaveValue("123456789012345678");
    await expect(again.getByLabel("Public Key")).toHaveValue("ab".repeat(32));
    await expect(again.getByRole("checkbox", { name: /Day-before reminders/ })).not.toBeChecked();
    // Still no bot token, so the buttons that talk to Discord stay off.
    await expect(again.getByRole("button", { name: "Test announcements" })).toBeDisabled();

    // Put it back so other tests see the bot as not set up.
    for (const label of ["Application ID", "Server ID", "Public Key", "Announcements channel ID"]) await again.getByLabel(label).fill("");
    await again.getByRole("checkbox", { name: /Day-before reminders/ }).check();
    await again.getByRole("button", { name: "Save Discord settings" }).click();
    await expect(page.getByText("Discord settings saved")).toBeVisible();
  });

  test("an expired or made-up connection link is refused, after sign-in", async ({ page }) => {
    await page.goto("/link-discord?token=made.up");
    await expect(page).toHaveURL(/\/sign-in/);
    await signInAs(page, "customer@mav.local");
    await page.goto("/link-discord?token=made.up");
    await expect(page.getByRole("heading", { name: "That link has expired" })).toBeVisible();
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Discord" })).toBeVisible();
    await expect(page.getByText(/Not connected/).filter({ visible: true }).first()).toBeVisible();
  });

  test("a player connects Discord with /link, signed the way Discord signs, then RSVPs from Discord", async ({ browser, request }) => {
    // Stand in for Discord: our own signing key, whose public half the admin saves as the application's.
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const publicHex = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
    const discordUser = { id: "923456789012345678", username: "misty", global_name: "Misty W" };
    const send = async (api: APIRequestContext, interaction: unknown) => {
      const body = JSON.stringify(interaction);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const response = await api.post("/api/discord/interactions", {
        data: body,
        headers: { "content-type": "application/json", "x-signature-ed25519": sign(null, Buffer.from(timestamp + body), privateKey).toString("hex"), "x-signature-timestamp": timestamp },
      });
      expect(response.status()).toBe(200);
      return (await response.json()) as { type: number; data?: { content?: string; components?: { components: { url?: string }[] }[] } };
    };

    const admin = await (await browser.newContext()).newPage();
    await signInAs(admin, "admin@mav.local", "/admin/site");
    const panel = admin.getByRole("region", { name: "Discord bot" });
    await panel.getByLabel("Public Key").fill(publicHex);
    await panel.getByRole("button", { name: "Save Discord settings" }).click();
    await expect(admin.getByText("Discord settings saved")).toBeVisible();

    try {
      // Discord's own check when the address is first saved in the Developer Portal.
      expect(await send(request, { type: 1 })).toEqual({ type: 1 });

      const linkReply = await send(request, { type: 2, data: { name: "link" }, member: { user: discordUser } });
      const url = linkReply.data?.components?.[0]?.components[0]?.url ?? "";
      expect(url).toContain("/link-discord?token=");

      const player = await (await browser.newContext()).newPage();
      await signInAs(player, "customer@mav.local");
      await player.goto(new URL(url).pathname + new URL(url).search);
      await expect(player.getByText("Misty W").filter({ visible: true }).first()).toBeVisible();
      await player.getByRole("button", { name: "Connect" }).click();
      await expect(player.getByRole("heading", { name: "You're connected" })).toBeVisible();
      await player.goto("/profile");
      await expect(player.getByText(/Connected as/).filter({ visible: true }).first()).toContainText("Misty W");

      // Now /rsvp works from Discord for that account, and shows on the site.
      const rsvp = await send(request, { type: 2, data: { name: "rsvp", options: [{ name: "event", value: "one-piece-casual" }] }, member: { user: discordUser } });
      expect(rsvp.data?.content).toContain("You're in");
      await player.goto("/events/one-piece-casual");
      await expect(player.getByText("You're going", { exact: true }).filter({ visible: true })).toBeVisible();

      const cancel = await send(request, { type: 2, data: { name: "cancel", options: [{ name: "event", value: "one-piece-casual" }] }, member: { user: discordUser } });
      expect(cancel.data?.content).toContain("released");
      const unlink = await send(request, { type: 2, data: { name: "unlink" }, member: { user: discordUser } });
      expect(unlink.data?.content).toContain("no longer connected");
      await player.context().close();
    } finally {
      await admin.goto("/admin/site");
      const again = admin.getByRole("region", { name: "Discord bot" });
      await again.getByLabel("Public Key").fill("");
      await again.getByRole("button", { name: "Save Discord settings" }).click();
      await expect(admin.getByText("Discord settings saved")).toBeVisible();
      await admin.context().close();
    }
  });
});
