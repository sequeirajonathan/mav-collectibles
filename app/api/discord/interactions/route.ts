import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { getDiscordSettings, verifyDiscordSignature } from "@lib/discord/core";
import { handleInteraction } from "@lib/discord/commands";
import { tags } from "@lib/data/tags";

/**
 * Where Discord sends slash commands. Open to the internet by design: the only
 * thing that makes a request trustworthy is Discord's signature, checked here
 * against the application's public key before anything else happens.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const { publicKey } = await getDiscordSettings();
  if (!publicKey || !verifyDiscordSignature(publicKey, request.headers.get("x-signature-ed25519"), request.headers.get("x-signature-timestamp"), body)) {
    return new NextResponse("invalid request signature", { status: 401 });
  }
  let interaction: unknown;
  try {
    interaction = JSON.parse(body);
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }
  const response = await handleInteraction(interaction);
  // An RSVP or cancellation changes seat counts on the site.
  const name = (interaction as { data?: { name?: string } }).data?.name;
  if (name === "rsvp" || name === "cancel") revalidateTag(tags.events, "max");
  return NextResponse.json(response);
}
