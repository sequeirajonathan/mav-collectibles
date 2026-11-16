import "server-only";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { getEvent, getLeaderboard, listEvents, listGames, listMyEvents, listSeasons, getBracket } from "@lib/data/hub";
import { capacityLabel, formatEntryFee, STORE_ADDRESS, STORE_NAME, STORE_PHONE } from "@lib/format";
import { isFull, registrationClosedReason } from "@lib/hub-rules";
import { checkAnswers, prefillFromProfile } from "@lib/event-questions";
import { viewBracket } from "@lib/bracket";
import { siteUrl, STORE } from "@lib/seo";
import { TCGPLAYER_STORE_URL } from "@const/links";
import { createLinkToken } from "./core";

/** Discord's numeric codes, named. */
const InteractionType = { Ping: 1, Command: 2, Autocomplete: 4 } as const;
const ResponseType = { Pong: 1, Message: 4, Autocomplete: 8 } as const;
const OptionType = { String: 3 } as const;
const EPHEMERAL = 64;
/** The logo's blue, for the stripe down the side of the bot's messages. */
const BRAND_COLOR = 0x1b6ca8;

/**
 * The slash commands the bot offers. Registered with Discord from Admin → Site.
 * Keep names and descriptions short: Discord shows them as the user types.
 */
export const COMMANDS = [
  {
    name: "events",
    description: "What's coming up at MAV Collectibles",
    options: [{ type: OptionType.String, name: "game", description: "Only this game", autocomplete: true }],
  },
  {
    name: "rsvp",
    description: "Save your seat at an event",
    options: [{ type: OptionType.String, name: "event", description: "Which event", required: true, autocomplete: true }],
  },
  {
    name: "cancel",
    description: "Give up your seat at an event",
    options: [{ type: OptionType.String, name: "event", description: "Which event", required: true, autocomplete: true }],
  },
  { name: "myevents", description: "The events you're signed up for" },
  {
    name: "standings",
    description: "Season standings",
    options: [{ type: OptionType.String, name: "game", description: "Which game (Pokémon if left out)", autocomplete: true }],
  },
  {
    name: "bracket",
    description: "How an event's bracket stands",
    options: [{ type: OptionType.String, name: "event", description: "Which event", required: true, autocomplete: true }],
  },
  { name: "hours", description: "Opening hours, address and phone" },
  { name: "singles", description: "Buy singles from our TCGplayer store" },
  { name: "link", description: "Connect your Discord to your MAV account, so you can RSVP from here" },
  { name: "unlink", description: "Disconnect your Discord from your MAV account" },
] as const;

const interactionSchema = z.object({
  type: z.number(),
  data: z
    .object({
      name: z.string(),
      options: z.array(z.object({ name: z.string(), value: z.union([z.string(), z.number(), z.boolean()]).optional(), focused: z.boolean().optional() })).optional(),
    })
    .optional(),
  member: z.object({ user: z.object({ id: z.string(), username: z.string(), global_name: z.string().nullish() }) }).optional(),
  user: z.object({ id: z.string(), username: z.string(), global_name: z.string().nullish() }).optional(),
});
type Interaction = z.infer<typeof interactionSchema>;

interface Reply {
  content?: string;
  embeds?: Record<string, unknown>[];
  components?: Record<string, unknown>[];
  /** Only the person who ran the command sees it. */
  ephemeral?: boolean;
}

const message = ({ ephemeral, ...data }: Reply) => ({
  type: ResponseType.Message,
  // Names typed by players or staff must never ping @everyone or a role.
  data: { ...data, allowed_mentions: { parse: [] }, ...(ephemeral ? { flags: EPHEMERAL } : {}) },
});
const privately = (content: string, components?: Record<string, unknown>[]) => message({ content, components, ephemeral: true });

const linkButton = (label: string, url: string) => ({ type: 2, style: 5, label, url });
const row = (...buttons: Record<string, unknown>[]) => ({ type: 1, components: buttons });

/** Discord renders this in each reader's own time zone. */
const when = (iso: string, style: "F" | "f" | "R" = "F") => `<t:${Math.floor(new Date(iso).getTime() / 1000)}:${style}>`;
const eventUrl = (slug: string) => `${siteUrl()}/events/${slug}`;
/** Stops text from being read as Discord formatting or a mention. */
const plain = (text: string) => text.replace(/([\\*_~`|>@#])/g, "\\$1");

const option = (interaction: Interaction, name: string) => {
  const value = interaction.data?.options?.find((o) => o.name === name)?.value;
  return typeof value === "string" ? value.trim() : "";
};

async function linkedAccount(discordUserId: string) {
  return prisma.profile.findUnique({ where: { discord_user_id: discordUserId }, select: { id: true, pokemon_player_id: true, birth_month: true } });
}

const NOT_LINKED = "Your Discord isn't connected to a MAV account yet. Run `/link` first, then try again.";

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
async function events(interaction: Interaction) {
  const game = option(interaction, "game");
  const upcoming = await listEvents({ gameId: game || undefined, limit: 8 });
  const open = upcoming.filter((e) => e.status === "published");
  if (open.length === 0) return message({ content: "Nothing on the calendar yet. Check back soon!" });
  return message({
    embeds: [
      {
        title: "Coming up at MAV Collectibles",
        url: `${siteUrl()}/events`,
        color: BRAND_COLOR,
        description: open
          .map((e) => `**[${plain(e.title)}](${eventUrl(e.slug)})**\n${when(e.startsAt)} · ${formatEntryFee(e.entryFeeCents)} · ${capacityLabel(e.capacity, e.registeredCount, e.waitlistCount)}`)
          .join("\n\n"),
        footer: { text: "Use /rsvp to save your seat" },
      },
    ],
  });
}

async function rsvp(interaction: Interaction, user: { id: string }) {
  const event = await getEvent(option(interaction, "event"));
  if (!event) return privately("I couldn't find that event. Pick one from the list that appears as you type.");
  const account = await linkedAccount(user.id);
  if (!account) return privately(NOT_LINKED);
  const closed = registrationClosedReason(event, Date.now());
  if (closed) return privately(`**${plain(event.title)}**: ${closed.toLowerCase()}.`);

  // Events can ask questions. If the profile answers all the required ones, sign them up; otherwise send them to the form.
  const { answers, errors } = checkAnswers(event.questions, prefillFromProfile(event.questions, { playerId: account.pokemon_player_id, birthMonth: account.birth_month }));
  if (Object.keys(errors).length > 0) {
    return privately(`**${plain(event.title)}** asks a few questions when you sign up. Finish here:`, [row(linkButton("Sign up", `${eventUrl(event.slug)}?rsvp=1`))]);
  }
  try {
    const [rows] = await prisma.$transaction([
      prisma.$queryRaw<{ status: string }[]>`select public.register_for_event(${event.id}::uuid, ${account.id}::uuid)::text as status`,
      prisma.eventRegistration.update({ where: { event_id_user_id: { event_id: event.id, user_id: account.id } }, data: { answers } }),
    ]);
    const waitlisted = rows[0]?.status === "waitlisted";
    return privately(
      waitlisted
        ? `You're on the waitlist for **${plain(event.title)}** (${when(event.startsAt)}). We'll move you up if a seat opens.`
        : `You're in for **${plain(event.title)}**! See you ${when(event.startsAt)}.${event.entryFeeCents ? ` Entry is ${formatEntryFee(event.entryFeeCents).toLowerCase()}.` : ""}`,
      [row(linkButton("Event page", eventUrl(event.slug)))]
    );
  } catch {
    return privately(`I couldn't sign you up for **${plain(event.title)}**${isFull(event) ? "" : ""}. Try on the event page:`, [row(linkButton("Event page", eventUrl(event.slug)))]);
  }
}

async function cancel(interaction: Interaction, user: { id: string }) {
  const event = await getEvent(option(interaction, "event"));
  if (!event) return privately("I couldn't find that event. Pick one from the list that appears as you type.");
  const account = await linkedAccount(user.id);
  if (!account) return privately(NOT_LINKED);
  const registration = await prisma.eventRegistration.findUnique({ where: { event_id_user_id: { event_id: event.id, user_id: account.id } }, select: { status: true } });
  if (!registration || registration.status === "cancelled") return privately(`You weren't signed up for **${plain(event.title)}**.`);
  if (registration.status === "checked_in") return privately("You're already checked in, so ask the staff if you need to drop.");
  await prisma.$executeRaw`select public.cancel_event_registration(${event.id}::uuid, ${account.id}::uuid)`;
  return privately(`Your seat at **${plain(event.title)}** has been released. Thanks for letting us know.`);
}

async function myEvents(user: { id: string }) {
  const account = await linkedAccount(user.id);
  if (!account) return privately(NOT_LINKED);
  const mine = await listMyEvents(account.id);
  if (mine.length === 0) return privately("You're not signed up for anything yet. Try `/events` to see what's on.");
  return message({
    ephemeral: true,
    embeds: [
      {
        title: "Your events",
        color: BRAND_COLOR,
        description: mine
          .map((e) => `**[${plain(e.title)}](${eventUrl(e.slug)})**\n${when(e.startsAt)} · ${e.myStatus === "waitlisted" ? "On the waitlist" : e.myStatus === "checked_in" ? "Checked in" : "Registered"}`)
          .join("\n\n"),
      },
    ],
  });
}

async function standings(interaction: Interaction) {
  const games = await listGames();
  const game = games.find((g) => g.id === (option(interaction, "game") || "pokemon")) ?? games[0];
  if (!game) return message({ content: "No games are set up yet." });
  const today = new Date().toISOString().slice(0, 10);
  const season = (await listSeasons(game.id)).find((s) => s.startsOn <= today && s.endsOn >= today);
  const rows = (await getLeaderboard(game.id, season?.id)).slice(0, 10);
  if (rows.length === 0) return message({ content: `No ${game.name} results yet${season ? ` this season (${season.name})` : ""}.` });
  return message({
    embeds: [
      {
        title: `${game.name} standings${season ? `: ${season.name}` : ""}`,
        url: `${siteUrl()}/leaderboard`,
        color: BRAND_COLOR,
        description: rows.map((r) => `**${r.rank}.** ${plain(r.playerName)} · ${r.points} pts · ${r.events} ${r.events === 1 ? "event" : "events"}`).join("\n"),
      },
    ],
  });
}

async function bracket(interaction: Interaction) {
  const event = await getEvent(option(interaction, "event"));
  if (!event) return privately("I couldn't find that event. Pick one from the list that appears as you type.");
  const stored = await getBracket(event.id, event.slug);
  if (!stored) return message({ content: `**${plain(event.title)}** doesn't have a bracket yet.`, components: [row(linkButton("Event page", eventUrl(event.slug)))] });
  const view = viewBracket(stored);
  const name = (id: string) => plain(stored.entrants.find((e) => e.id === id)?.name ?? "?");
  const upNext = view.rounds
    .flatMap((r) => r.matches.filter((m) => m.playable).map((m) => (m.a.kind === "entrant" && m.b.kind === "entrant" ? `${r.title}: ${name(m.a.id)} vs ${name(m.b.id)}` : "")))
    .filter(Boolean)
    .slice(0, 8);
  const lines = view.champion ? [`🏆 **Champion: ${name(view.champion)}**`] : upNext.length ? ["**Up next**", ...upNext] : ["Waiting for the first results."];
  return message({
    embeds: [
      {
        title: `${event.title}: bracket`,
        url: eventUrl(event.slug),
        color: BRAND_COLOR,
        description: lines.join("\n"),
        footer: { text: `${stored.format === "double" ? "Double" : "Single"} elimination · ${stored.entrants.length} players · best of ${stored.bestOf}` },
      },
    ],
  });
}

function hours() {
  const clock = (t: string) => {
    const [h = 0, m = 0] = t.split(":").map(Number);
    return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
  };
  const open = STORE.hours.map((h) => `${h.days.join(", ")}: ${clock(h.opens)} to ${clock(h.closes)}`);
  return message({
    embeds: [
      {
        title: STORE_NAME,
        url: `${siteUrl()}/visit`,
        color: BRAND_COLOR,
        description: [`📍 ${STORE_ADDRESS}`, `📞 ${STORE_PHONE}`, "", "Monday: Closed", ...open].join("\n"),
      },
    ],
    components: [row(linkButton("Directions", `https://maps.google.com/?q=${encodeURIComponent(`${STORE_NAME}, ${STORE_ADDRESS}`)}`))],
  });
}

function singles() {
  return message({ content: "Shop our singles on TCGplayer and pick up in store:", components: [row(linkButton("Shop singles", TCGPLAYER_STORE_URL))] });
}

async function link(user: { id: string; username: string; global_name?: string | null }) {
  if (await linkedAccount(user.id)) return privately("Your Discord is already connected to a MAV account. Use `/unlink` if you want to change it.");
  const url = `${siteUrl()}/link-discord?token=${encodeURIComponent(createLinkToken(user.id, user.global_name || user.username))}`;
  return privately("Tap the button, sign in to your MAV account (or make one), and confirm. The link works for 15 minutes and only for you.", [row(linkButton("Connect my account", url))]);
}

async function unlink(user: { id: string }) {
  const { count } = await prisma.profile.updateMany({ where: { discord_user_id: user.id }, data: { discord_user_id: null, discord_username: null } });
  return privately(count ? "Done. Your Discord is no longer connected to a MAV account." : "Your Discord wasn't connected to a MAV account.");
}

// ---------------------------------------------------------------------------
// Suggestions shown while someone types an option
// ---------------------------------------------------------------------------
async function autocomplete(interaction: Interaction, user: { id: string } | undefined) {
  const focused = interaction.data?.options?.find((o) => o.focused);
  const typed = (typeof focused?.value === "string" ? focused.value : "").toLowerCase();
  let choices: { name: string; value: string }[] = [];
  if (focused?.name === "game") {
    choices = (await listGames()).map((g) => ({ name: g.name, value: g.id }));
  } else if (focused?.name === "event") {
    if (interaction.data?.name === "cancel") {
      const account = user ? await linkedAccount(user.id) : null;
      choices = account ? (await listMyEvents(account.id)).map((e) => ({ name: e.title, value: e.slug })) : [];
    } else {
      choices = (await listEvents({ limit: 25 })).filter((e) => e.status === "published").map((e) => ({ name: e.title, value: e.slug }));
    }
  }
  return {
    type: ResponseType.Autocomplete,
    data: { choices: choices.filter((c) => c.name.toLowerCase().includes(typed)).slice(0, 25).map((c) => ({ name: c.name.slice(0, 100), value: c.value })) },
  };
}

/** Answers one interaction from Discord. The caller has already checked the signature. */
export async function handleInteraction(raw: unknown): Promise<Record<string, unknown>> {
  const parsed = interactionSchema.safeParse(raw);
  if (!parsed.success) return privately("I didn't understand that.");
  const interaction = parsed.data;
  if (interaction.type === InteractionType.Ping) return { type: ResponseType.Pong };
  // In a server the user is under `member`; in a direct message it's `user`.
  const user = interaction.member?.user ?? interaction.user;
  if (interaction.type === InteractionType.Autocomplete) return autocomplete(interaction, user);
  if (interaction.type !== InteractionType.Command || !interaction.data) return privately("I can't do that yet.");
  if (!user) return privately("I couldn't tell who you are. Try again from the server.");
  try {
    switch (interaction.data.name) {
      case "events":
        return await events(interaction);
      case "rsvp":
        return await rsvp(interaction, user);
      case "cancel":
        return await cancel(interaction, user);
      case "myevents":
        return await myEvents(user);
      case "standings":
        return await standings(interaction);
      case "bracket":
        return await bracket(interaction);
      case "hours":
        return hours();
      case "singles":
        return singles();
      case "link":
        return await link(user);
      case "unlink":
        return await unlink(user);
      default:
        return privately("I don't know that command yet.");
    }
  } catch (error) {
    console.error("Discord command failed", interaction.data.name, error);
    return privately("Something went wrong on our side. Please try again in a moment.");
  }
}
