"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Check, Download, Search, UserMinus } from "lucide-react";
import { Button } from "@components/ui/button";
import { displayAnswer, type EventQuestion } from "@lib/event-questions";
import { removeAttendee, setCheckIn, viewAnswerFile } from "@lib/actions/hub";
import type { Attendee } from "@lib/contracts/hub";
import { cn } from "@utils";
import { cardVariants } from "@components/ui/card";

/** Door list with one-tap check-in. Big tap targets for using on a phone at the counter. */
/** One spreadsheet cell; quoted, and never starting with a character a spreadsheet would run as a formula. */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

const STATUS_LABEL = { registered: "Registered", waitlisted: "Waitlist", checked_in: "Checked in", cancelled: "Cancelled" } as const;

export function attendeesCsv(attendees: Attendee[], questions: EventQuestion[]): string {
  const header = ["Name", "Email", "Status", "Registered", ...questions.map((q) => q.label)];
  const rows = attendees.map((a) => [a.displayName, a.email ?? "", STATUS_LABEL[a.status], a.registeredAt.slice(0, 10), ...questions.map((q) => displayAnswer(q, a.answers[q.id]))]);
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}

export function AttendeeList({ eventId, eventSlug, attendees, questions = [] }: { eventId: string; eventSlug?: string; attendees: Attendee[]; questions?: EventQuestion[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attendees;
    // Players are often known by the name they gave on the form, not their account name.
    return attendees.filter((a) => [a.displayName, a.email ?? "", ...Object.values(a.answers)].some((text) => text.toLowerCase().includes(q)));
  }, [attendees, query]);

  const going = attendees.filter((a) => a.status !== "waitlisted");
  const checkedIn = attendees.filter((a) => a.status === "checked_in").length;

  const download = () => {
    // The leading mark makes Excel read accents correctly.
    const url = URL.createObjectURL(new Blob(["\uFEFF", attendeesCsv(attendees, questions)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${eventSlug ?? "event"}-players.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openFile = async (userId: string, questionId: string) => {
    // Opened first, inside the tap, so phones don't block it as a pop-up.
    const tab = window.open("", "_blank");
    const result = await viewAnswerFile({ eventId, userId, questionId });
    if (!result.ok) {
      tab?.close();
      return void toast.error(result.error);
    }
    (tab ?? window).location.assign(result.data.url);
  };

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
        {attendees.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={download}>
            <Download aria-hidden /> Download spreadsheet
          </Button>
        )}
        <label className="flex w-full items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 fold:w-64">
          <Search className="size-4 text-muted-foreground" />
          <span className="sr-only">Find a player</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a player" className="min-h-11 w-full bg-transparent text-base outline-none" />
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className={cn(cardVariants({ variant: "dashed", radius: "lg" }), "px-4 py-8 text-center text-sm text-muted-foreground")}>No one here yet.</p>
      ) : (
        <ul className={cardVariants({ variant: "list" })}>
          {filtered.map((a) => {
            const isIn = a.status === "checked_in";
            return (
              <li key={a.userId} className="flex items-start gap-3 px-3 py-2 fold:px-4">
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
                  {questions.length > 0 && (
                    <dl className="mt-1 grid gap-x-4 gap-y-0.5 text-xs fold:grid-cols-2">
                      {questions.map((q) => (
                        <div key={q.id} className="flex min-w-0 gap-1">
                          <dt className="shrink-0 text-muted-foreground">{q.label}:</dt>
                          <dd className={cn("min-w-0 whitespace-pre-line break-words", a.answers[q.id] ? "font-semibold" : "text-muted-foreground")}>
                            {q.type === "file" && a.answers[q.id] ? (
                              <button type="button" className="font-semibold text-gold underline underline-offset-2" onClick={() => openFile(a.userId, q.id)}>
                                View file
                              </button>
                            ) : (
                              displayAnswer(q, a.answers[q.id]) || "—"
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
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
