import type { EventDetail, EventSummary } from "@lib/contracts/hub";
import { formatLongDate } from "@lib/format";

type RegistrationWindow = Pick<EventDetail, "status" | "startsAt" | "registrationOpensAt" | "registrationClosesAt">;

/** Why an event can't be RSVPed right now, or null when registration is open. */
export function registrationClosedReason(event: RegistrationWindow, now: number): string | null {
  if (event.status === "cancelled") return "Event cancelled";
  if (event.status === "completed" || event.status === "draft") return "Registration closed";
  const closesAt = new Date(event.registrationClosesAt ?? event.startsAt).getTime();
  if (now > closesAt) return "Registration closed";
  if (event.registrationOpensAt && now < new Date(event.registrationOpensAt).getTime()) {
    return `Opens ${formatLongDate(event.registrationOpensAt)}`;
  }
  return null;
}

export const isFull = (event: Pick<EventSummary, "capacity" | "registeredCount">) =>
  event.capacity !== null && event.registeredCount >= event.capacity;

/** Published events that haven't finished (allowing a few hours' grace after the start). */
export function upcomingOnly<T extends Pick<EventSummary, "status" | "startsAt">>(events: T[], now: number, graceHours = 6): T[] {
  return events.filter((e) => e.status === "published" && new Date(e.startsAt).getTime() > now - graceHours * 3_600_000);
}

/** Server components call this after `connection()` so the time is read per request. */
export const requestTime = () => Date.now();
