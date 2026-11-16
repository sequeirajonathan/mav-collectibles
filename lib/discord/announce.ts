import "server-only";
import { prisma } from "@lib/prisma";
import { capacityLabel, formatEntryFee } from "@lib/format";
import { siteUrl } from "@lib/seo";
import { getDiscordSettings, postToChannel } from "./core";

/**
 * What the bot posts on its own. Every function here is best-effort and safe
 * to call whether or not the bot is set up: with no token or no channel it
 * does nothing, and a Discord problem never fails the action that called it.
 */

const BRAND_COLOR = 0x1b6ca8;
const stamp = (date: Date, style: "F" | "R" | "t" = "F") => `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
const linkButton = (label: string, url: string) => ({ type: 1, components: [{ type: 2, style: 5, label, url }] });
const plain = (text: string) => text.replace(/([\\*_~`|>@#])/g, "\\$1");

/** Announces a published event in the announcements channel, once. */
export async function announceEvent(eventId: string): Promise<void> {
  try {
    const settings = await getDiscordSettings();
    if (!settings.announceEvents || !settings.announceChannelId) return;
    // Claim it first, so two saves at once (or a later edit) can't announce twice.
    const claimed = await prisma.event.updateMany({
      where: { id: eventId, status: "published", discord_announced_at: null, starts_at: { gt: new Date() } },
      data: { discord_announced_at: new Date() },
    });
    if (claimed.count === 0) return;
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
    if (!event) return;
    const url = `${siteUrl()}/events/${event.slug}`;
    const sent = await postToChannel(settings.announceChannelId, {
      embeds: [
        {
          title: event.title,
          url,
          color: BRAND_COLOR,
          description: [event.summary && plain(event.summary), `🗓️ ${stamp(event.starts_at)} (${stamp(event.starts_at, "R")})`, `🎟️ ${formatEntryFee(event.entry_fee_cents)}`, event.capacity ? `👥 ${event.capacity} seats` : null]
            .filter(Boolean)
            .join("\n"),
          author: { name: event.game ? `New ${event.game.name} event` : "New event" },
          ...(event.cover_image_url?.startsWith("https://") ? { image: { url: event.cover_image_url } } : {}),
          footer: { text: "RSVP on the site, or with /rsvp here" },
        },
      ],
      components: [linkButton("Details and RSVP", `${url}?rsvp=1`)],
    });
    // If Discord refused it, let a later save try again.
    if (!sent) await prisma.event.updateMany({ where: { id: eventId }, data: { discord_announced_at: null } });
  } catch (error) {
    console.error("Discord event announcement failed", error);
  }
}

/** Posts a reminder for each event starting in the next day. Run once a day by the scheduled job. */
export async function remindUpcomingEvents(now = new Date()): Promise<number> {
  const settings = await getDiscordSettings();
  if (!settings.announceReminders || !settings.announceChannelId) return 0;
  const soon = await prisma.event.findMany({
    where: { status: "published", discord_reminded_at: null, starts_at: { gt: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } },
    orderBy: { starts_at: "asc" },
    take: 10,
  });
  let sent = 0;
  for (const event of soon) {
    const claimed = await prisma.event.updateMany({ where: { id: event.id, discord_reminded_at: null }, data: { discord_reminded_at: now } });
    if (claimed.count === 0) continue;
    const [registered, waitlisted] = await Promise.all([
      prisma.eventRegistration.count({ where: { event_id: event.id, status: { in: ["registered", "checked_in"] } } }),
      prisma.eventRegistration.count({ where: { event_id: event.id, status: "waitlisted" } }),
    ]);
    const url = `${siteUrl()}/events/${event.slug}`;
    const ok = await postToChannel(settings.announceChannelId, {
      embeds: [
        {
          title: event.title,
          url,
          color: BRAND_COLOR,
          author: { name: "Happening soon" },
          description: [`Starts ${stamp(event.starts_at, "R")}, at ${stamp(event.starts_at, "t")}.`, `${capacityLabel(event.capacity, registered, waitlisted)} · ${formatEntryFee(event.entry_fee_cents)}`].join("\n"),
        },
      ],
      components: [linkButton("Details and RSVP", `${url}?rsvp=1`)],
    });
    if (ok) sent++;
    else await prisma.event.updateMany({ where: { id: event.id }, data: { discord_reminded_at: null } });
  }
  return sent;
}

/** Congratulates a bracket's champion in the announcements channel, once per event. */
export async function announceChampion(eventId: string, championName: string): Promise<void> {
  try {
    const settings = await getDiscordSettings();
    if (!settings.announceResults || !settings.announceChannelId) return;
    const claimed = await prisma.event.updateMany({ where: { id: eventId, discord_champion_at: null }, data: { discord_champion_at: new Date() } });
    if (claimed.count === 0) return;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true, slug: true } });
    if (!event) return;
    await postToChannel(settings.announceChannelId, {
      embeds: [{ title: `🏆 ${championName} wins ${event.title}!`, url: `${siteUrl()}/events/${event.slug}`, color: 0xffd02e, description: "Congratulations! The full bracket is on the event page." }],
      components: [linkButton("See the bracket", `${siteUrl()}/events/${event.slug}`)],
    });
  } catch (error) {
    console.error("Discord champion announcement failed", error);
  }
}

/** A heads-up for staff in their private channel (new request, job application, vendor application…). */
export async function alertStaff(title: string, detail: string, path: string): Promise<void> {
  try {
    const settings = await getDiscordSettings();
    if (!settings.staffAlerts || !settings.staffChannelId) return;
    await postToChannel(settings.staffChannelId, {
      embeds: [{ title: title.slice(0, 250), description: plain(detail).slice(0, 1500), color: BRAND_COLOR }],
      components: [linkButton("Open in Admin", `${siteUrl()}${path}`)],
    });
  } catch (error) {
    console.error("Discord staff alert failed", error);
  }
}
