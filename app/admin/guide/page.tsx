import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES, HIRING_ROLES, UserRole } from "@interfaces/roles";
import { cn } from "@utils";

export const metadata: Metadata = { title: "Guide" };

interface Topic {
  title: string;
  where: { href: Route; label: string };
  /** Who can use it; everyone on the team when omitted. */
  only?: "admin" | "hiring";
  steps: string[];
}

interface Section {
  heading: string;
  intro: string;
  topics: Topic[];
}

/** Keep this in step with the screens it describes: staff learn the site from it. */
const SECTIONS: Section[] = [
  {
    heading: "Running events",
    intro: "Everything for league nights, tournaments, pre-releases and vendor days.",
    topics: [
      {
        title: "Create an event",
        where: { href: "/admin/events/new", label: "Events → New event" },
        steps: [
          "Tap a template (League night, MAV Cup, Pre-release…) to fill in the usual type, format and entry fee, then change anything you like.",
          "Set the start time, capacity and entry fee. Leave capacity blank for unlimited.",
          "Status “Draft” keeps it hidden. Switch to “Published” when it is ready for players.",
          "Tick “Feature on the home page” to put it in the spotlight on the front page.",
        ],
      },
      {
        title: "Ask players for details when they sign up",
        where: { href: "/admin/events/new", label: "Event form → Questions for players" },
        steps: [
          "Tap “Pokémon player info” to add player name, Player ID and date of birth in one go, or “Add a question” to write your own.",
          "Pick the answer type (short answer, number, date, pick one, yes/no) and tick “Required” if players must answer.",
          "Players answer when they RSVP, so there is no separate Google Form to keep in step.",
        ],
      },
      {
        title: "Share the sign-up link",
        where: { href: "/admin/events", label: "Events → open an event → Copy sign-up link" },
        steps: [
          "Open a published event and tap “Copy sign-up link”.",
          "Paste it in Discord, a text or a social post. It opens the event with the sign-up form ready.",
          "Players sign in (or make a free account) first, so each RSVP belongs to a real person.",
        ],
      },
      {
        title: "Add an outside link to an event",
        where: { href: "/admin/events", label: "Event form → Link" },
        steps: [
          "Paste a web address in “Link” (rules, a stream, a waiver) and it becomes a button on the event page.",
          "Web addresses typed into the details are clickable too.",
        ],
      },
      {
        title: "Check players in at the door",
        where: { href: "/admin/events", label: "Events → open an event → Check-in" },
        steps: [
          "Tap the box beside a name to check them in. Tap again to undo.",
          "Use “Find a player” to search by name, email or anything they answered.",
          "Each player’s answers show under their name.",
          "“Download spreadsheet” saves the whole list, answers included, for Excel or Google Sheets.",
        ],
      },
      {
        title: "Post results and season points",
        where: { href: "/admin/events", label: "Events → open an event → Results" },
        steps: [
          "Tap “Fill from checked-in players” to start the list, then enter placements and records.",
          "Saved results appear on the event page and feed the leaderboard.",
        ],
      },
      {
        title: "Run a season",
        where: { href: "/admin/seasons", label: "Seasons" },
        steps: ["Create a season with a start and end date for a game.", "Results from events inside those dates add up on the public leaderboard."],
      },
      {
        title: "Repeat an event",
        where: { href: "/admin/events", label: "Events → open an event → Duplicate" },
        steps: ["“Duplicate” copies everything, questions and link included, to a new date as a draft."],
      },
    ],
  },
  {
    heading: "Talking to customers",
    intro: "News, announcements and the banner at the top of the site.",
    topics: [
      {
        title: "Post news",
        where: { href: "/admin/posts/new", label: "Posts → New post" },
        steps: ["Write a headline and the post, pick a game, and link an event if it is about one.", "Customers can like, save and comment on published posts."],
      },
      {
        title: "Change the banner at the top of every page",
        where: { href: "/admin/site", label: "Site → Alert banner" },
        only: "admin",
        steps: ["Edit the message and save.", "Turn “Show alert banner” off under Features to hide it."],
      },
      {
        title: "Set the Discord invite",
        where: { href: "/admin/site", label: "Site → Community" },
        only: "admin",
        steps: ["Paste the invite link so the “Ask on Discord” buttons point to your server."],
      },
    ],
  },
  {
    heading: "Vendors",
    intro: "People who set up a table on vendor days.",
    topics: [
      {
        title: "Review vendor applications",
        where: { href: "/admin/vendors", label: "Vendors" },
        steps: ["Approve or reject each application.", "For a vendor day, confirm or decline their table. Confirmed vendors appear on that event’s page."],
      },
    ],
  },
  {
    heading: "The team",
    intro: "Staying in touch and getting things fixed.",
    topics: [
      {
        title: "Team chat",
        where: { href: "/admin/chat", label: "Chat" },
        steps: [
          "A private channel for staff: messages, photos and GIFs. Customers never see it.",
          "Tap “Notify me on this device” to get a notification for new messages.",
          "On an iPhone, first add the site to your Home Screen (Share → Add to Home Screen) and open it from there.",
        ],
      },
      {
        title: "Ask for a feature or report a problem",
        where: { href: "/admin/requests", label: "Requests" },
        steps: [
          "Say what you want or what went wrong, and mark it urgent if it can’t wait.",
          "Follow it under “To do”. When it is finished, the team is told in Chat and you get an email.",
        ],
      },
      {
        title: "Job applications",
        where: { href: "/admin/applications", label: "Applications" },
        only: "hiring",
        steps: ["Applications from the We’re hiring page land here with the résumé.", "Move each one along: Reviewing, Interview, Hired or Not moving forward."],
      },
      {
        title: "Give someone access",
        where: { href: "/admin/roles", label: "Roles" },
        only: "admin",
        steps: [
          "They sign up on the site first.",
          "Start typing their name, username or email and pick them from the suggestions. Close spellings work.",
          "Choose Event team, Staff or Admin. “Who has access” lists everyone on the team; tap a person to change or remove their access.",
        ],
      },
    ],
  },
  {
    heading: "The shop and the site",
    intro: "Switches and upkeep.",
    topics: [
      {
        title: "Turn parts of the site on and off",
        where: { href: "/admin/site", label: "Site → Features" },
        only: "admin",
        steps: [
          "“Show the shop to customers” hides or shows the online shop. Admins and staff can always preview it.",
          "“Show vendors” hides or shows the Vendors section.",
          "Other switches cover Google reviews, the videos on the home page and Facebook sign-in.",
        ],
      },
      {
        title: "Keep shop search up to date",
        where: { href: "/admin/site", label: "Site → Shop search" },
        only: "admin",
        steps: ["Search refreshes itself every night.", "Tap “Update now” after a big change in Square."],
      },
      {
        title: "Approve better product photos",
        where: { href: "/admin/photos", label: "Photos" },
        steps: ["Suggested replacements for missing or poor photos appear here.", "Customers only see one after you approve it."],
      },
    ],
  },
];

const anchor = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

async function Guide() {
  const user = await requirePageRole(CONTENT_ROLES, "/admin/guide");
  const allowed = (topic: Topic) =>
    topic.only === "admin" ? user.role === UserRole.ADMIN : topic.only === "hiring" ? HIRING_ROLES.includes(user.role) : true;
  const sections = SECTIONS.map((s) => ({ ...s, topics: s.topics.filter(allowed) })).filter((s) => s.topics.length > 0);
  return (
    <div className="space-y-10">
      <nav aria-label="Guide sections" className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a key={s.heading} href={`#${anchor(s.heading)}`} className="ui-chip inline-flex min-h-11 items-center rounded-full border border-line bg-panel px-3 text-sm font-semibold can-hover:min-h-9">
            {s.heading}
          </a>
        ))}
      </nav>
      {sections.map((s) => (
        <section key={s.heading} aria-labelledby={anchor(s.heading)}>
          <h2 id={anchor(s.heading)} className="scroll-mt-24 text-xl font-bold">
            {s.heading}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{s.intro}</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {s.topics.map((t) => (
              <article key={t.title} className={cn(cardVariants({ padding: "md" }), "flex flex-col")}>
                <h3 className="font-bold">{t.title}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                  {t.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <Link href={t.where.href} className="mt-auto inline-flex min-h-11 items-center pt-2 text-sm font-semibold text-gold hover:text-gold-light">
                  {t.where.label} →
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function AdminGuidePage() {
  return (
    <>
      <PageHeader title="Guide" description="What you can do here, and where to find it. You only see the parts your account can use." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Guide />
      </Suspense>
    </>
  );
}
