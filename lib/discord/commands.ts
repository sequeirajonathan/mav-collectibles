import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { getEvent, getLeaderboard, listAttendees, listEvents, listGames, listMyEvents, listPosts, listSeasons, getBracket } from "@lib/data/hub";
import { capacityLabel, formatEntryFee, STORE_ADDRESS, STORE_NAME, STORE_PHONE } from "@lib/format";
import { isFull, registrationClosedReason } from "@lib/hub-rules";
import { PLAYER_ID, checkAnswers, displayAnswer, parseStoredQuestions, prefillFromProfile } from "@lib/event-questions";
import { JOB_OPENINGS } from "@const/jobs";
import { CONTENT_ROLES, parseRole } from "@interfaces/roles";
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
  { name: "help", description: "What this bot can do" },
  {
    name: "events",
    description: "What's coming up at MAV Collectibles",
    options: [{ type: OptionType.String, name: "game", description: "Only this game", autocomplete: true }],
  },
  {
    name: "event",
    description: "Details for one event: time, entry, seats and what to bring",
    options: [{ type: OptionType.String, name: "event", description: "Which event", required: true, autocomplete: true }],
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
    name: "rank",
    description: "Where you stand this season",
    options: [{ type: OptionType.String, name: "game", description: "Which game (Pokémon if left out)", autocomplete: true }],
  },
  {
    name: "bracket",
    description: "How an event's bracket stands",
    options: [{ type: OptionType.String, name: "event", description: "Which event", required: true, autocomplete: true }],
  },
  { name: "news", description: "The latest from the shop" },
  { name: "hours", description: "Opening hours, address and phone" },
  { name: "singles", description: "Buy singles from our TCGplayer store" },
  { name: "sell", description: "Sell or trade your cards to the shop" },
  { name: "jobs", description: "Work at MAV Collectibles" },
  {
    name: "playerid",
    description: "See or save your Pokémon Player ID, so sign-ups fill it in",
    options: [{ type: OptionType.String, name: "id", description: "Your Play! Pokémon ID (leave out to see what's saved)" }],
  },
  { name: "link", description: "Connect your Discord to your MAV account, so you can RSVP from here" },
  { name: "unlink", description: "Disconnect your Discord from your MAV account" },
  {
    name: "attendees",
    description: "Staff: who's signed up for an event",
    options: [{ type: OptionType.String, name: "event", description: "Which event", required: true, autocomplete: true }],
  },
] as const;

/** Changes whenever the command list does; Admin compares it with what Discord was last told. */
export const COMMANDS_VERSION = createHash("sha256").update(JSON.stringify(COMMANDS)).digest("hex").slice(0, 16);

/** How /help groups the commands, in the order a new player would want them. */
const HELP_GROUPS: { title: string; commands: (typeof COMMANDS)[number]["name"][] }[] = [
  { title: "Events", commands: ["events", "event", "rsvp", "cancel", "myevents", "bracket"] },
  { title: "Standings", commands: ["standings", "rank"] },
  { title: "Your account", commands: ["link", "unlink", "playerid"] },
  { title: "The shop", commands: ["news", "hours", "singles", "sell", "jobs"] },
];

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

function help() {
  const described = new Map<string, string>(COMMANDS.map((c) => [c.name, c.description]));
  return message({
    ephemeral: true,
    embeds: [
      {
        title: "What I can do",
        color: BRAND_COLOR,
        description: "Type `/` and pick a command. Anything about your own account is shown only to you.",
        fields: HELP_GROUPS.map((group) => ({
          name: group.title,
          value: group.commands.map((name) => `\`/${name}\` ${described.get(name) ?? ""}`).join("\n"),
        })),
        footer: { text: "New here? Start with /events, then /link so you can /rsvp." },
      },
    ],
    components: [row(linkButton("Open the website", siteUrl()))],
  });
}

async function eventDetails(interaction: Interaction) {
  const event = await getEvent(option(interaction, "event"));
  if (!event) return privately("I couldn't find that event. Pick one from the list that appears as you type.");
  const closed = registrationClosedReason(event, Date.now());
  const lines = [
    `🗓️ ${when(event.startsAt)} (${when(event.startsAt, "R")})`,
    `📍 ${plain(event.location)}`,
    `🎟️ ${formatEntryFee(event.entryFeeCents)}`,
    `👥 ${capacityLabel(event.capacity, event.registeredCount, event.waitlistCount)}`,
    event.format ? `🃏 ${plain(event.format)}` : null,
    closed ? `🚫 ${closed}` : event.registrationClosesAt ? `⏳ Sign-ups close ${when(event.registrationClosesAt, "R")}` : null,
    event.questions.length ? `📝 Sign-up asks for: ${event.questions.map((q) => plain(q.label)).join(", ")}` : null,
  ].filter(Boolean);
  return message({
    embeds: [
      {
        title: event.title,
        url: eventUrl(event.slug),
        color: BRAND_COLOR,
        description: [event.summary && plain(event.summary), "", ...lines].filter((l) => l !== null && l !== undefined).join("\n").trim().slice(0, 3500),
        ...(event.coverImageUrl?.startsWith("https://") ? { image: { url: event.coverImageUrl } } : {}),
      },
    ],
    components: [row(linkButton(closed ? "Event page" : "Details and RSVP", closed ? eventUrl(event.slug) : `${eventUrl(event.slug)}?rsvp=1`), ...(event.linkUrl ? [linkButton((event.linkLabel || "More info").slice(0, 80), event.linkUrl)] : []))],
  });
}

async function rank(interaction: Interaction, user: { id: string }) {
  const account = await linkedAccount(user.id);
  if (!account) return privately(NOT_LINKED);
  const games = await listGames();
  const game = games.find((g) => g.id === (option(interaction, "game") || "pokemon")) ?? games[0];
  if (!game) return privately("No games are set up yet.");
  const today = new Date().toISOString().slice(0, 10);
  const season = (await listSeasons(game.id)).find((s) => s.startsOn <= today && s.endsOn >= today);
  const rows = await getLeaderboard(game.id, season?.id);
  const mine = rows.find((r) => r.userId === account.id);
  const scope = `${game.name}${season ? `, ${season.name}` : ""}`;
  if (!mine) return privately(`You don't have any ${scope} results yet. Play in an event and you'll show up here.`);
  return privately(`**${scope}**: you're **#${mine.rank}** of ${rows.length} with **${mine.points} points** from ${mine.events} ${mine.events === 1 ? "event" : "events"}.`, [
    row(linkButton("Full standings", `${siteUrl()}/leaderboard`)),
  ]);
}

async function news() {
  const { posts } = await listPosts({ limit: 4 });
  if (posts.length === 0) return message({ content: "No news yet. Check back soon!" });
  return message({
    embeds: [
      {
        title: "Latest from MAV Collectibles",
        url: `${siteUrl()}/feed`,
        color: BRAND_COLOR,
        description: posts
          .map((p) => {
            const body = plain(p.body.replace(/\s+/g, " ").trim());
            return `**${plain(p.title)}**${p.publishedAt ? ` · ${when(p.publishedAt, "R")}` : ""}\n${body.length > 180 ? `${body.slice(0, 180)}…` : body}`;
          })
          .join("\n\n"),
      },
    ],
    components: [row(linkButton("Read more", `${siteUrl()}/feed`))],
  });
}

function sell() {
  return message({
    content: `We buy and trade cards, slabs and sealed product. Bring them to the counter, or call ${STORE_PHONE} first for a big collection.`,
    components: [row(linkButton("How selling works", `${siteUrl()}/sell-your-cards`))],
  });
}

function jobs() {
  const openings = JOB_OPENINGS.map((o) => `**${o.title}**: ${o.summary}`).join("\n");
  return message({ content: `We're hiring!\n${openings}`.slice(0, 1900), components: [row(linkButton("Apply", `${siteUrl()}/jobs`))] });
}

async function playerId(interaction: Interaction, user: { id: string }) {
  const account = await linkedAccount(user.id);
  if (!account) return privately(NOT_LINKED);
  const given = option(interaction, "id");
  if (!given) {
    return privately(account.pokemon_player_id ? `Your saved Pokémon Player ID is **${account.pokemon_player_id}**. Run \`/playerid id:<number>\` to change it.` : "You haven't saved a Pokémon Player ID yet. Run `/playerid id:<number>` to save one.");
  }
  if (!PLAYER_ID.test(given)) return privately("Player IDs are numbers only. Check it and try again.");
  await prisma.profile.update({ where: { id: account.id }, data: { pokemon_player_id: given } });
  return privately(`Saved. Your Pokémon Player ID is **${given}**, and event sign-ups will fill it in for you.`);
}

/** Staff only, and only ever shown to the person who asked: it lists players' names. */
async function attendees(interaction: Interaction, user: { id: string }) {
  const account = await linkedAccount(user.id);
  if (!account) return privately(NOT_LINKED);
  const [siteUser] = await prisma.$queryRaw<{ role: string | null }[]>`select raw_app_meta_data->>'role' as role from auth.users where id = ${account.id}::uuid`;
  if (!CONTENT_ROLES.includes(parseRole(siteUser?.role))) return privately("That command is for MAV staff.");
  const slug = option(interaction, "event");
  const event = await prisma.event.findUnique({ where: { slug }, select: { id: true, title: true, capacity: true, questions: true } });
  if (!event) return privately("I couldn't find that event. Pick one from the list that appears as you type.");
  const list = await listAttendees(event.id);
  if (list.length === 0) return privately(`Nobody has signed up for **${plain(event.title)}** yet.`);
  const going = list.filter((a) => a.status !== "waitlisted");
  const idQuestion = event ? parseStoredQuestions(event.questions).find((q) => q.autofill === "playerId") : undefined;
  const line = (a: (typeof list)[number]) =>
    `${a.status === "checked_in" ? "✅" : a.status === "waitlisted" ? "⏳" : "▫️"} ${plain(a.displayName)}${idQuestion && a.answers[idQuestion.id] ? ` · ID ${displayAnswer(idQuestion, a.answers[idQuestion.id])}` : ""}`;
  const shown = list.slice(0, 40).map(line);
  return message({
    ephemeral: true,
    embeds: [
      {
        title: `${event.title}: ${going.length}${event.capacity ? ` of ${event.capacity}` : ""} signed up`,
        color: BRAND_COLOR,
        description: [...shown, list.length > shown.length ? `…and ${list.length - shown.length} more` : ""].filter(Boolean).join("\n"),
        footer: { text: `${list.filter((a) => a.status === "checked_in").length} checked in · ${list.length - going.length} on the waitlist` },
      },
    ],
    components: [row(linkButton("Open check-in", `${siteUrl()}/admin/events/${event.id}/attendees`))],
  });
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
      case "help":
        return help();
      case "events":
        return await events(interaction);
      case "event":
        return await eventDetails(interaction);
      case "rank":
        return await rank(interaction, user);
      case "news":
        return await news();
      case "sell":
        return sell();
      case "jobs":
        return jobs();
      case "playerid":
        return await playerId(interaction, user);
      case "attendees":
        return await attendees(interaction, user);
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
        return privately("I don't know that command yet. Try `/help`.");
    }
  } catch (error) {
    console.error("Discord command failed", interaction.data.name, error);
    return privately("Something went wrong on our side. Please try again in a moment.");
  }
}
