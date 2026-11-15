import { FaDiscord } from "react-icons/fa";
import { getCommunity } from "@lib/data/site";
import { cn } from "@utils";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/**
 * "Join us on Discord" card with live member counts. Renders nothing when no
 * invite is set or Discord reports it expired.
 */
export async function DiscordCta({ className }: { className?: string }) {
  const community = await getCommunity();
  if (!community.discordUrl || !community.valid) return null;
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-discord/40 bg-gradient-to-br from-discord/25 via-panel to-panel p-5 fold:p-6",
        className
      )}
    >
      <FaDiscord aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-36 text-discord/15 fold:size-44" />
      <div className="relative flex flex-col gap-4 fold:flex-row fold:items-center fold:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <FaDiscord aria-hidden className="size-6 text-discord" />
            Join the MAV Discord
          </h2>
          <p className="mt-1 max-w-xl text-foreground/80">
            Event updates, pairings, trade nights and deck talk with the local community.
          </p>
          {community.members !== null && (
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{compact.format(community.members)}</strong> members
              </span>
              {community.online !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="size-2 rounded-full bg-success" />
                  <strong className="text-foreground">{compact.format(community.online)}</strong> online
                </span>
              )}
            </p>
          )}
        </div>
        <DiscordButton href={community.discordUrl} className="fold:shrink-0" />
      </div>
    </section>
  );
}

export function DiscordButton({ href, className, label = "Join Discord" }: { href: string; className?: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-discord px-5 font-bold text-white shadow-md transition-colors hover:bg-discord/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-discord",
        className
      )}
    >
      <FaDiscord aria-hidden className="size-5" />
      {label}
    </a>
  );
}

/** Small "Ask on Discord" link for event pages. */
export async function DiscordLink({ className }: { className?: string }) {
  const community = await getCommunity();
  if (!community.discordUrl || !community.valid) return null;
  return (
    <a
      href={community.discordUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-md border border-discord/50 px-3 text-sm font-semibold text-foreground hover:bg-discord/15",
        className
      )}
    >
      <FaDiscord aria-hidden className="size-4 text-discord" />
      Questions? Ask on Discord
    </a>
  );
}

/** Footer social icon. */
export async function DiscordIcon() {
  const community = await getCommunity();
  if (!community.discordUrl || !community.valid) return null;
  return (
    <a
      href={community.discordUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discord"
      className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-gold"
    >
      <FaDiscord size={20} />
    </a>
  );
}
