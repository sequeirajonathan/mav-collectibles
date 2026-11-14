import { listEvents } from "@lib/data/hub";
import { buildIcs } from "@lib/calendar";

/** Subscribable calendar of every upcoming event (Apple/Google "subscribe by URL"). */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const events = await listEvents({ limit: 200 });
  const ics = buildIcs(
    events.map((e) => ({
      uid: e.id,
      title: e.title,
      description: e.summary,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      location: e.location === "MAV Collectibles" ? undefined : e.location,
      url: `${origin}/events/${e.slug}`,
      cancelled: e.status === "cancelled",
    })),
    { name: "MAV Collectibles Events" }
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="mav-collectibles-events.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
