"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { inputClass } from "@components/ui/field";
import { findPeople, setUserRole } from "@lib/actions/account";
import type { Person } from "@lib/data/users";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

const ROLES = [
  { value: "USER", label: "Customer", help: "Default for everyone" },
  { value: "EVENT", label: "Event team", help: "Events, posts, vendors, check-in, results" },
  { value: "STAFF", label: "Staff", help: "Everything Event team can do, plus print jobs" },
  { value: "PRINT_AGENT", label: "Print agent", help: "The shop PC that prints shipping labels" },
  { value: "ADMIN", label: "Admin", help: "Everything, including site settings and roles" },
] as const;
type RoleValue = (typeof ROLES)[number]["value"];

const roleLabel = (role: RoleValue) => ROLES.find((r) => r.value === role)?.label ?? role;

function PersonLine({ person }: { person: Person }) {
  return (
    <span className="min-w-0 flex-1 text-left">
      <span className="block truncate font-semibold">{person.name}</span>
      <span className="block truncate text-xs text-muted-foreground">{[person.username && `@${person.username}`, person.email].filter(Boolean).join(" · ")}</span>
    </span>
  );
}

function RoleTag({ role }: { role: RoleValue }) {
  return <span className={cn("ui-badge shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold", role === "USER" ? "border-line text-muted-foreground" : "border-gold/50 text-gold")}>{roleLabel(role)}</span>;
}

/** Pick a person from suggestions, then choose what they can do. */
export function RolesForm({ team, newest }: { team: Person[]; newest: Person[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>(newest);
  const [searching, setSearching] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [role, setRole] = useState<RoleValue>("STAFF");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const latest = useRef(0);

  // Suggestions follow what's typed, a moment after the typing stops.
  useEffect(() => {
    const text = query.trim();
    if (!text) return;
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await findPeople({ query: text });
      // Ignore answers to anything but the latest thing typed.
      if (ticket !== latest.current) return;
      setSearching(false);
      if (result.ok) setResults(result.data.people);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const shown = query.trim() ? results : newest;

  const choose = (p: Person) => {
    setPerson(p);
    setRole(p.role === "USER" ? "STAFF" : p.role);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;
    startTransition(async () => {
      const result = await setUserRole({ user: person.id, role });
      if (!result.ok) return void toast.error(result.error);
      toast.success(`${person.name} is now ${roleLabel(result.data.role)}. They'll need to sign in again.`);
      setPerson(null);
      setQuery("");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,28rem)_1fr] lg:items-start">
      <form ref={formRef} onSubmit={submit} className={cn(cardVariants({ padding: "md" }), "scroll-mt-24 space-y-5")}>
        <div>
          <h2 className="text-base font-bold">Change someone&apos;s access</h2>
          <p className="text-xs text-muted-foreground">They need an account first. Ask them to sign up on the site, then find them here.</p>
        </div>

        {person ? (
          <div className="flex items-center gap-3 rounded-lg border border-gold bg-gold/5 p-3">
            <PersonLine person={person} />
            <RoleTag role={person.role} />
            <Button type="button" variant="ghost" size="icon" aria-label="Choose someone else" onClick={() => setPerson(null)}>
              <X />
            </Button>
          </div>
        ) : (
          <div>
            <label htmlFor="person-search" className="text-sm font-semibold">
              Find a person
            </label>
            <p className="text-xs text-muted-foreground">Type part of a name, username or email. Close spellings work too.</p>
            <div className="relative mt-1.5">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="person-search"
                type="search"
                className={cn(inputClass, "pl-9")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                aria-controls="person-results"
              />
              {searching && <Loader2 aria-hidden className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{query.trim() ? "Matches" : "Newest accounts"}</p>
            <ul id="person-results" aria-label="People" className="mt-1.5 space-y-1.5">
              {shown.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => choose(p)} className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-line p-2.5 hover:border-gold hover:bg-panel-2">
                    <PersonLine person={p} />
                    <RoleTag role={p.role} />
                  </button>
                </li>
              ))}
            </ul>
            {shown.length === 0 && !searching && (
              <p role="status" className="mt-2 text-sm text-muted-foreground">
                Nobody matches “{query.trim()}”. They may not have signed up yet, or may have used a different email.
              </p>
            )}
          </div>
        )}

        <fieldset disabled={!person} className="disabled:opacity-50">
          <legend className="text-sm font-semibold">Role</legend>
          <div className="mt-2 space-y-2">
            {ROLES.map((r) => (
              <label key={r.value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-gold">
                <input type="radio" name="role" className="mt-1 accent-[var(--gold)]" checked={role === r.value} onChange={() => setRole(r.value)} />
                <span>
                  <span className="block font-semibold">{r.label}</span>
                  <span className="text-sm text-muted-foreground">{r.help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-xs text-muted-foreground">The person needs to sign out and back in for the change to take effect.</p>
        <Button type="submit" variant="gold" disabled={pending || !person || role === person.role}>
          {pending && <Loader2 className="animate-spin" />}
          Update role
        </Button>
      </form>

      <section aria-labelledby="team-heading">
        <h2 id="team-heading" className="text-base font-bold">
          Who has access ({team.length})
        </h2>
        <p className="text-xs text-muted-foreground">Everyone with more than customer access. Tap a person to change or remove it.</p>
        <ul className={cn(cardVariants({ variant: "list" }), "mt-3")}>
          {team.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => choose(p)} className="flex min-h-11 w-full items-center gap-3 p-3 hover:bg-panel-2">
                <PersonLine person={p} />
                <RoleTag role={p.role} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
