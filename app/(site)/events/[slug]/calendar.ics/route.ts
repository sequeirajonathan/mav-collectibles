import { getEvent } from "@lib/data/hub";
import { buildIcs } from "@lib/calendar";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return new Response("Not found", { status: 404 });
  const ics = buildIcs([
    {
      uid: event.id,
      title: event.title,
      description: event.summary,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location === "MAV Collectibles" ? undefined : event.location,
      url: `${new URL(request.url).origin}/events/${event.slug}`,
      cancelled: event.status === "cancelled",
    },
  ]);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
