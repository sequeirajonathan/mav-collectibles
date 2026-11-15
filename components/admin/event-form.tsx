"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { Field, inputClass } from "@components/ui/field";
import { QuestionsEditor } from "./questions-editor";
import { ImageUpload } from "./image-upload";
import { ConfirmButton } from "./confirm-button";
import { createEvent, deleteEvent, duplicateEvent, updateEvent } from "@lib/actions/hub";
import { EVENT_KINDS, EVENT_KIND_LABELS, type Game } from "@lib/contracts/hub";
import { storeLocalToIso, STORE_TIME_ZONE } from "@lib/format";
import { EVENT_TEMPLATES, type EventFormValues } from "./event-form-values";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

const slugify = (v: string) => v.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 70);
const toIso = (local: string) => (local ? storeLocalToIso(local) : "");

/** First problem with the sign-up questions, in words staff can act on. */
function questionError(errors: Record<string, string>): string | undefined {
  const entry = Object.entries(errors).find(([key]) => key === "questions" || key.startsWith("questions."));
  if (!entry) return undefined;
  const index = Number(entry[0].split(".")[1]);
  return Number.isInteger(index) ? `Question ${index + 1}: ${entry[1]}` : entry[1];
}

export function EventForm({ games, eventId, initial }: { games: Game[]; eventId?: string; initial: EventFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(eventId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof EventFormValues>(k: K, value: EventFormValues[K]) => setV((cur) => ({ ...cur, [k]: value }));

  const payload = () => ({
    title: v.title,
    slug: v.slug,
    summary: v.summary,
    description: v.description,
    kind: v.kind,
    gameId: v.gameId,
    format: v.format,
    startsAt: toIso(v.startsAt),
    endsAt: toIso(v.endsAt),
    location: v.location,
    linkUrl: v.linkUrl,
    linkLabel: v.linkLabel,
    questions: v.questions,
    coverImageUrl: v.coverImageUrl,
    capacity: v.capacity,
    entryFeeDollars: v.entryFeeDollars,
    registrationOpensAt: toIso(v.registrationOpensAt),
    registrationClosesAt: toIso(v.registrationClosesAt),
    status: v.status,
    featured: v.featured,
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = eventId ? await updateEvent({ id: eventId, values: payload() }) : await createEvent(payload());
      if (!result.ok) {
        setErrors(result.fieldErrors ? Object.fromEntries(Object.entries(result.fieldErrors).map(([k, m]) => [k.replace(/^values\./, ""), m])) : {});
        toast.error(result.error);
        return;
      }
      toast.success(eventId ? "Event saved" : "Event created");
      if (!eventId) router.push(`/admin/events/${result.data.id}`);
      else router.refresh();
    });
  };

  const duplicate = () => {
    if (!eventId) return;
    const next = window.prompt("New start (YYYY-MM-DDTHH:MM, store time)", v.startsAt);
    if (!next) return;
    startTransition(async () => {
      const result = await duplicateEvent({ id: eventId, startsAt: storeLocalToIso(next) });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Copied as a draft");
      router.push(`/admin/events/${result.data.id}`);
    });
  };

  const remove = () =>
    eventId &&
    startTransition(async () => {
      const result = await deleteEvent({ id: eventId });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Event deleted");
      router.push("/admin/events");
    });

  return (
    <form onSubmit={save} className="space-y-6">
      {!eventId && (
        <fieldset>
          <legend className="text-sm font-semibold">Start from a template</legend>
          <p className="text-xs text-muted-foreground">Fills in the type, game, format and entry fee. Change anything after.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EVENT_TEMPLATES.map((t) => (
              <Button
                key={t.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setV((cur) => ({ ...cur, ...t.values, slug: slugTouched ? cur.slug : slugify(t.values.title) }));
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Title" error={errors.title}>
          {(id) => (
            <input id={id} className={inputClass} value={v.title} required onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
          )}
        </Field>
        <Field label="URL" hint={`mavcollectibles.com/events/${v.slug || "…"}`} error={errors.slug}>
          {(id) => <input id={id} className={inputClass} value={v.slug} required onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />}
        </Field>
      </div>
      <div className="grid gap-5 fold:grid-cols-3">
        <Field label="Type" error={errors.kind}>
          {(id) => (
            <select id={id} className={inputClass} value={v.kind} onChange={(e) => set("kind", EVENT_KINDS.find((k) => k === e.target.value) ?? "tournament")}>
              {EVENT_KINDS.map((k) => <option key={k} value={k}>{EVENT_KIND_LABELS[k]}</option>)}
            </select>
          )}
        </Field>
        <Field label="Game" error={errors.gameId}>
          {(id) => (
            <select id={id} className={inputClass} value={v.gameId} onChange={(e) => set("gameId", e.target.value)}>
              <option value="">Any / multiple</option>
              {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Format" hint="e.g. Standard, Booster Draft" error={errors.format}>
          {(id) => <input id={id} className={inputClass} value={v.format} onChange={(e) => set("format", e.target.value)} />}
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">Times are in store time ({STORE_TIME_ZONE.replace("_", " ")}).</p>
      <div className="grid gap-5 fold:grid-cols-2">
        <Field label="Starts" error={errors.startsAt}>
          {(id) => <input id={id} type="datetime-local" className={inputClass} value={v.startsAt} required onChange={(e) => set("startsAt", e.target.value)} />}
        </Field>
        <Field label="Ends (optional)" error={errors.endsAt}>
          {(id) => <input id={id} type="datetime-local" className={inputClass} value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} />}
        </Field>
      </div>
      <div className="grid gap-5 fold:grid-cols-3">
        <Field label="Capacity" hint="Blank = unlimited" error={errors.capacity}>
          {(id) => <input id={id} type="number" min={1} inputMode="numeric" className={inputClass} value={v.capacity} onChange={(e) => set("capacity", e.target.value)} />}
        </Field>
        <Field label="Entry fee ($)" hint="Paid at the door; blank = free" error={errors.entryFeeDollars}>
          {(id) => <input id={id} type="number" min={0} step="0.01" inputMode="decimal" className={inputClass} value={v.entryFeeDollars} onChange={(e) => set("entryFeeDollars", e.target.value)} />}
        </Field>
        <Field label="Location" error={errors.location}>
          {(id) => <input id={id} className={inputClass} value={v.location} onChange={(e) => set("location", e.target.value)} />}
        </Field>
      </div>
      <div className="grid gap-5 fold:grid-cols-2">
        <Field label="Registration opens (optional)" error={errors.registrationOpensAt}>
          {(id) => <input id={id} type="datetime-local" className={inputClass} value={v.registrationOpensAt} onChange={(e) => set("registrationOpensAt", e.target.value)} />}
        </Field>
        <Field label="Registration closes" hint="Blank = when the event starts" error={errors.registrationClosesAt}>
          {(id) => <input id={id} type="datetime-local" className={inputClass} value={v.registrationClosesAt} onChange={(e) => set("registrationClosesAt", e.target.value)} />}
        </Field>
      </div>
      <div className="grid gap-5 fold:grid-cols-[2fr_1fr]">
        <Field label="Link (optional)" hint="A sign-up form or page players need, such as a Google Form. Shown as a button on the event." error={errors.linkUrl}>
          {(id) => <input id={id} type="url" inputMode="url" placeholder="https://" className={inputClass} value={v.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} />}
        </Field>
        <Field label="Button text" hint="Blank = Player form" error={errors.linkLabel}>
          {(id) => <input id={id} maxLength={40} placeholder="Player form" className={inputClass} value={v.linkLabel} onChange={(e) => set("linkLabel", e.target.value)} />}
        </Field>
      </div>
      <Field label="Short summary" hint="Shown on cards and in calendars (200 characters)" error={errors.summary}>
        {(id) => <input id={id} maxLength={200} className={inputClass} value={v.summary} onChange={(e) => set("summary", e.target.value)} />}
      </Field>
      <Field label="Details" hint="Prizes, deck rules, what to bring…" error={errors.description}>
        {(id) => <textarea id={id} rows={8} className={inputClass} value={v.description} onChange={(e) => set("description", e.target.value)} />}
      </Field>
      <QuestionsEditor value={v.questions} onChange={(next) => set("questions", next)} error={questionError(errors)} />
      <ImageUpload label="Cover image" folder="events" value={v.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} />
      <div className={cn(cardVariants({ padding: "md" }), "flex flex-wrap items-center gap-4")}>
        <Field label="Status">
          {(id) => (
            <select id={id} className={inputClass} value={v.status} onChange={(e) => set("status", (["draft", "published", "cancelled", "completed"] as const).find((s) => s === e.target.value) ?? "draft")}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          )}
        </Field>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-5 accent-[var(--gold)]" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} />
          Feature on the home page
        </label>
      </div>
      <div className="flex flex-col gap-2 fold:flex-row fold:flex-wrap">
        <Button type="submit" variant="gold" disabled={pending}>{eventId ? "Save changes" : "Create event"}</Button>
        {eventId && <Button type="button" variant="outline" onClick={duplicate} disabled={pending}>Duplicate…</Button>}
        {eventId && <ConfirmButton label="Delete event" confirmLabel="Delete forever" onConfirm={remove} disabled={pending} />}
      </div>
    </form>
  );
}
