"use client";

import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { LinkButton } from "@components/ui/link-button";
import { FaDiscord } from "react-icons/fa";
import { linkDiscordAccount } from "@lib/actions/discord";
import { cn } from "@utils";

/** Confirms connecting the Discord account that ran /link to the signed-in site account. */
export function LinkDiscord({ token, discordName, accountName }: { token: string; discordName: string; accountName: string }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const connect = () =>
    startTransition(async () => {
      const result = await linkDiscordAccount({ token });
      if (!result.ok) return void toast.error(result.error);
      setDone(true);
    });

  return (
    <div className={cn(cardVariants({ padding: "lg" }), "space-y-4 text-center")}>
      <FaDiscord aria-hidden className="mx-auto size-10 text-[#5865F2]" />
      {done ? (
        <>
          <h1 className="font-display text-3xl">You&apos;re connected</h1>
          <p className="text-muted-foreground">
            <strong className="text-foreground">{discordName}</strong> on Discord is now linked to your MAV account. Head back to Discord and try <code>/rsvp</code>.
          </p>
          <LinkButton href="/events">See events</LinkButton>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl">Connect Discord?</h1>
          <p className="text-muted-foreground">
            Link <strong className="text-foreground">{discordName}</strong> on Discord to your MAV account <strong className="text-foreground">{accountName}</strong>. You&apos;ll be able to RSVP and
            see your events from Discord.
          </p>
          <div className="flex flex-col gap-2 fold:flex-row fold:justify-center">
            <Button type="button" variant="gold" onClick={connect} disabled={pending}>
              Connect
            </Button>
            <LinkButton href="/" variant="ghost">
              Not now
            </LinkButton>
          </div>
          <p className="text-xs text-muted-foreground">Not you? Sign out, sign in to the right account, and open the link again.</p>
        </>
      )}
    </div>
  );
}
