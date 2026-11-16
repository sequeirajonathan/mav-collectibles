"use server";

import { z } from "zod";
import { prisma } from "@lib/prisma";
import { ActionError, createAction } from "@lib/actions/safe-action";
import { UserRole } from "@interfaces/roles";
import { COMMANDS, COMMANDS_VERSION } from "@lib/discord/commands";
import { DiscordError, discordApi, getDiscordSettings, readLinkToken } from "@lib/discord/core";

const ADMIN = [UserRole.ADMIN] as const;

const snowflake = (label: string) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().regex(/^[0-9]{15,22}$/, `${label} is a long number. Copy it from Discord.`).nullable());

const settingsInput = z.object({
  applicationId: snowflake("The application ID"),
  publicKey: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[0-9a-f]{64}$/, "The public key is 64 letters and numbers. Copy it from the Developer Portal.")
      .nullable()
  ),
  guildId: snowflake("The server ID"),
  announceChannelId: snowflake("The announcements channel ID"),
  staffChannelId: snowflake("The staff channel ID"),
  announceEvents: z.boolean(),
  announceReminders: z.boolean(),
  announceResults: z.boolean(),
  staffAlerts: z.boolean(),
});

/** ADMIN only: where the bot posts and what it announces. */
export const saveDiscordSettings = createAction({ input: settingsInput, access: ADMIN }, async (input) => {
  const data = {
    application_id: input.applicationId,
    public_key: input.publicKey,
    guild_id: input.guildId,
    announce_channel_id: input.announceChannelId,
    staff_channel_id: input.staffChannelId,
    announce_events: input.announceEvents,
    announce_reminders: input.announceReminders,
    announce_results: input.announceResults,
    staff_alerts: input.staffAlerts,
    updated_at: new Date(),
  };
  await prisma.discordSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  return null;
});

/** Discord's reason, in words an admin can act on. */
function explain(error: unknown): string {
  if (!(error instanceof DiscordError)) return "Couldn't reach Discord. Try again in a minute.";
  if (error.status === 401) return "Discord rejected the bot token. Reset it in the Developer Portal and save the new one under Service keys.";
  if (error.status === 403) return "The bot isn't allowed to do that. Check it has been added to the server and can see and post in that channel.";
  if (error.status === 404) return "Discord couldn't find that server or channel. Check the IDs.";
  return error.message;
}

/** ADMIN only: tells Discord which slash commands the bot offers in the shop's server. */
export const registerDiscordCommands = createAction({ input: z.object({}), access: ADMIN }, async () => {
  const settings = await getDiscordSettings();
  if (!settings.applicationId || !settings.guildId) throw new ActionError("Save the application ID and server ID first.");
  try {
    await discordApi(`/applications/${settings.applicationId}/guilds/${settings.guildId}/commands`, { method: "PUT", body: COMMANDS });
  } catch (error) {
    throw new ActionError(explain(error));
  }
  await prisma.discordSettings.update({ where: { id: 1 }, data: { commands_registered_at: new Date(), commands_version: COMMANDS_VERSION } });
  return { count: COMMANDS.length };
});

/** ADMIN only: posts a hello in a channel to prove the bot can speak there. */
export const sendDiscordTest = createAction({ input: z.object({ channel: z.enum(["announce", "staff"]) }), access: ADMIN }, async ({ channel }) => {
  const settings = await getDiscordSettings();
  const channelId = channel === "announce" ? settings.announceChannelId : settings.staffChannelId;
  if (!channelId) throw new ActionError("Save that channel's ID first.");
  try {
    await discordApi(`/channels/${channelId}/messages`, { body: { content: "👋 The MAV Collectibles bot is connected to this channel.", allowed_mentions: { parse: [] } } });
  } catch (error) {
    throw new ActionError(explain(error));
  }
  return null;
});

/** A signed-in player confirms the connection they started with /link in Discord. */
export const linkDiscordAccount = createAction({ input: z.object({ token: z.string().max(600) }), access: "user" }, async ({ token }, user) => {
  const link = readLinkToken(token);
  if (!link) throw new ActionError("That link has expired. Run /link in Discord again.");
  const taken = await prisma.profile.findUnique({ where: { discord_user_id: link.discordUserId }, select: { id: true } });
  if (taken && taken.id !== user.id) throw new ActionError("That Discord account is already connected to another MAV account. Run /unlink in Discord first.");
  await prisma.profile.update({ where: { id: user.id }, data: { discord_user_id: link.discordUserId, discord_username: link.discordUsername } });
  return { username: link.discordUsername };
});

/** A player disconnects their Discord account from the site. */
export const unlinkDiscordAccount = createAction({ input: z.object({}), access: "user" }, async (_input, user) => {
  await prisma.profile.update({ where: { id: user.id }, data: { discord_user_id: null, discord_username: null } });
  return null;
});
