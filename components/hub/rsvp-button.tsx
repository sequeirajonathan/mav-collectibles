"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { cancelRegistration, registerForEvent } from "@lib/actions/hub";
import type { RegistrationStatus } from "@lib/contracts/hub";

interface RsvpButtonProps {
  eventId: string;
  slug: string;
  status: RegistrationStatus | null;
  signedIn: boolean;
  /** Null when registration is open; otherwise why it isn't. */
  closedReason: string | null;
  full: boolean;
}

export function RsvpButton({ eventId, slug, status, signedIn, closedReason, full }: RsvpButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // What the server last confirmed to this button. It wins over the `status`
  // prop so a page refresh that started before the RSVP can't undo it on screen.
  const [confirmed, setConfirmed] = useState<{ status: RegistrationStatus | null } | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(confirmed ? confirmed.status : status);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!signedIn) {
    return (
      <Button asChild variant="gold" className="w-full fold:w-auto">
        <Link href={`/sign-in?next=/events/${slug}`}>Sign in to RSVP</Link>
      </Button>
    );
  }

  const register = () =>
    startTransition(async () => {
      setOptimistic(full ? "waitlisted" : "registered");
      const result = await registerForEvent({ eventId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirmed({ status: result.data.status });
      toast.success(result.data.status === "waitlisted" ? "You're on the waitlist" : "You're in! See you there.");
      router.refresh();
    });

  const cancel = () =>
    startTransition(async () => {
      setConfirmingCancel(false);
      setOptimistic(null);
      const result = await cancelRegistration({ eventId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirmed({ status: null });
      toast.success("Your spot was released");
      router.refresh();
    });

  if (optimistic === "registered" || optimistic === "checked_in" || optimistic === "waitlisted") {
    const label =
      optimistic === "waitlisted" ? "On the waitlist" : optimistic === "checked_in" ? "Checked in" : "You're going";
    return (
      <div className="flex w-full flex-col gap-2 fold:w-auto fold:flex-row fold:items-center">
        <span className="inline-flex items-center justify-center gap-2 rounded-md border border-success/50 bg-success/10 px-4 py-2 text-sm font-bold text-success">
          {optimistic === "waitlisted" ? <Clock className="size-4" /> : <Check className="size-4" />}
          {label}
        </span>
        {optimistic !== "checked_in" &&
          (confirmingCancel ? (
            <span className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancel} disabled={pending}>
                Yes, cancel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>
                Keep my spot
              </Button>
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(true)} disabled={pending}>
              Cancel RSVP
            </Button>
          ))}
      </div>
    );
  }

  if (closedReason) {
    return (
      <Button variant="outline" disabled className="w-full fold:w-auto">
        {closedReason}
      </Button>
    );
  }

  return (
    <Button variant="gold" onClick={register} disabled={pending} className="w-full fold:w-auto">
      {pending && <Loader2 className="animate-spin" />}
      {full ? "Join the waitlist" : "RSVP"}
    </Button>
  );
}
