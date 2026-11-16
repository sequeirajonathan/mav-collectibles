"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { cancelRegistration, registerForEvent, saveRegistrationAnswers } from "@lib/actions/hub";
import type { Answers, EventQuestion } from "@lib/event-questions";
import { RsvpQuestions } from "./rsvp-questions";
import type { RegistrationStatus } from "@lib/contracts/hub";

interface RsvpButtonProps {
  eventId: string;
  slug: string;
  status: RegistrationStatus | null;
  signedIn: boolean;
  /** Null when registration is open; otherwise why it isn't. */
  closedReason: string | null;
  full: boolean;
  /** Asked before the RSVP is saved. */
  questions?: EventQuestion[];
  /** This player's saved answers, when they're already registered. */
  answers?: Answers;
  /** Opened from a sign-up link: go straight to the questions. */
  autoOpen?: boolean;
}

export function RsvpButton({ eventId, slug, status, signedIn, closedReason, full, questions = [], answers = {}, autoOpen = false }: RsvpButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // What the server last confirmed to this button. It wins over the `status`
  // prop so a page refresh that started before the RSVP can't undo it on screen.
  const [confirmed, setConfirmed] = useState<{ status: RegistrationStatus | null } | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(confirmed ? confirmed.status : status);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [asking, setAsking] = useState(autoOpen && signedIn && status === null && !closedReason && questions.length > 0);
  const [savedAnswers, setSavedAnswers] = useState<Answers>(answers);

  if (!signedIn) {
    return (
      <Button asChild variant="gold" className="w-full fold:w-auto">
        <Link href={autoOpen ? `/sign-in?next=${encodeURIComponent(`/events/${slug}?rsvp=1`)}` : `/sign-in?next=/events/${slug}`}>Sign in to RSVP</Link>
      </Button>
    );
  }

  const register = (given: Answers = {}) =>
    startTransition(async () => {
      setOptimistic(full ? "waitlisted" : "registered");
      const result = await registerForEvent({ eventId, answers: given });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedAnswers(given);
      setAsking(false);
      setConfirmed({ status: result.data.status });
      toast.success(result.data.status === "waitlisted" ? "You're on the waitlist" : "You're in! See you there.");
      router.refresh();
    });

  const saveAnswers = (given: Answers) =>
    startTransition(async () => {
      const result = await saveRegistrationAnswers({ eventId, answers: given });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedAnswers(given);
      setAsking(false);
      toast.success("Your details were updated");
    });

  const cancel = () =>
    startTransition(async () => {
      setConfirmingCancel(false);
      setAsking(false);
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
    if (asking) {
      return <RsvpQuestions eventId={eventId} questions={questions} initial={savedAnswers} submitLabel="Save my details" pending={pending} onSubmit={saveAnswers} onCancel={() => setAsking(false)} />;
    }
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
            <>
              {questions.length > 0 && !pending && (
                <Button variant="ghost" size="sm" onClick={() => setAsking(true)}>
                  Edit my details
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(true)} disabled={pending}>
                Cancel RSVP
              </Button>
            </>
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

  if (asking) {
    return (
      <RsvpQuestions
        eventId={eventId}
        questions={questions}
        initial={savedAnswers}
        submitLabel={full ? "Join the waitlist" : "Confirm RSVP"}
        pending={pending}
        onSubmit={register}
        onCancel={() => setAsking(false)}
      />
    );
  }

  return (
    <Button variant="gold" onClick={() => (questions.length > 0 ? setAsking(true) : register())} disabled={pending} className="w-full fold:w-auto">
      {pending && <Loader2 className="animate-spin" />}
      {full ? "Join the waitlist" : "RSVP"}
    </Button>
  );
}
