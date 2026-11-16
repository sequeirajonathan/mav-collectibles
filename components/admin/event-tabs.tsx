import Link from "next/link";
import { cn } from "@utils";

export function EventTabs({ id, active }: { id: string; active: "details" | "attendees" | "bracket" | "results" }) {
  const tab = (key: typeof active, href: string, label: string) => (
    <Link href={href} aria-current={active === key ? "page" : undefined} className={cn("inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold", active === key ? "bg-panel-2 text-gold" : "text-muted-foreground hover:text-foreground")}>
      {label}
    </Link>
  );
  return (
    <nav aria-label="Event sections" className="mb-5 flex flex-wrap gap-1">
      {tab("details", `/admin/events/${id}`, "Details")}
      {tab("attendees", `/admin/events/${id}/attendees`, "Check-in")}
      {tab("bracket", `/admin/events/${id}/bracket`, "Bracket")}
      {tab("results", `/admin/events/${id}/results`, "Results")}
    </nav>
  );
}
