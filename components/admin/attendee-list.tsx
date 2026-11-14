"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Check, Search, UserMinus } from "lucide-react";
import { removeAttendee, setCheckIn } from "@lib/actions/hub";
import type { Attendee } from "@lib/contracts/hub";
import { cn } from "@utils";

/** Door list with one-tap check-in. Big tap targets for using on a phone at the counter. */
export function AttendeeList({ eventId, attendees }: { eventId: string; attendees: Attendee[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? attendees.filter((a) => a.displayName.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)) : attendees;
  }, [attendees, query]);

  const going = attendees.filter((a) => a.status !== "waitlisted");
  const checkedIn = attendees.filter((a) => a.status === "checked_in").length;

  const run = (fn: () => ReturnType<typeof setCheckIn>) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{checkedIn}</strong> of {going.length} checked in
          {attendees.length > going.length && ` · ${attendees.length - going.length} waitlisted`}
        </p>
        <label className="flex w-full items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 fold:w-64">
          <Search className="size-4 text-muted-foreground" />
          <span className="sr-only">Find a player</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a player" className="min-h-11 w-full bg-transparent text-base outline-none" />
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted-foreground">No one here yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
          {filtered.map((a) => {
            const isIn = a.status === "checked_in";
            return (
              <li key={a.userId} className="flex items-center gap-3 px-3 py-2 fold:px-4">
                <button
                  type="button"
                  disabled={pending || a.status === "waitlisted"}
                  onClick={() => run(() => setCheckIn({ eventId, userId: a.userId, checkedIn: !isIn }))}
                  className={cn(
                    "inline-flex size-12 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
                    isIn ? "border-success bg-success text-ink" : "border-line text-transparent hover:border-success/60",
                    a.status === "waitlisted" && "opacity-30"
                  )}
                  aria-label={isIn ? `Undo check-in for ${a.displayName}` : `Check in ${a.displayName}`}
                  aria-pressed={isIn}
                >
                  <Check className="size-6" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.status === "waitlisted" ? "Waitlist" : isIn ? "Checked in" : "Registered"}
                    {a.email && ` · ${a.email}`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeAttendee({ eventId, userId: a.userId }))}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-danger"
                  aria-label={`Remove ${a.displayName}`}
                >
                  <UserMinus className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
