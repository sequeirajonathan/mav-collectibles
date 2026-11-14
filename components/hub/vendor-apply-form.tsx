"use client";

import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { applyAsVendor } from "@lib/actions/hub";
import type { Game } from "@lib/contracts/hub";
import { formatEventWhen } from "@lib/format";
import { Field, inputClass } from "@components/hub/form";

interface Defaults {
  name: string;
  bio: string;
  specialties: string;
  games: string[];
  instagram: string;
  website: string;
  contactEmail: string;
}

export function VendorApplyForm({
  games,
  vendorDays,
  defaults,
  existingStatus,
}: {
  games: Game[];
  vendorDays: { id: string; title: string; startsAt: string }[];
  defaults: Defaults;
  existingStatus: "pending" | "approved" | "rejected" | null;
}) {
  const [values, setValues] = useState({ ...defaults, eventId: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await applyAsVendor({
        ...values,
        instagram: values.instagram || null,
        website: values.website || null,
        eventId: values.eventId || null,
        message: values.message || null,
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="rounded-xl border border-success/40 bg-success/10 p-6 text-center">
        <p className="text-lg font-bold text-success">Application received</p>
        <p className="mt-1 text-sm text-foreground/80">The MAV team will review it and reach out at {values.contactEmail}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {existingStatus && (
        <p className="rounded-lg border border-line bg-panel px-4 py-3 text-sm">
          Your vendor profile is <strong className="capitalize text-gold">{existingStatus}</strong>. Saving updates it.
        </p>
      )}
      <Field label="Shop or vendor name" error={errors.name}>
        {(id) => <input id={id} className={inputClass} value={values.name} onChange={(e) => set("name", e.target.value)} required />}
      </Field>
      <Field label="What do you bring?" hint="e.g. Vintage Pokémon, graded slabs, sealed Japanese product" error={errors.specialties}>
        {(id) => <input id={id} className={inputClass} value={values.specialties} onChange={(e) => set("specialties", e.target.value)} />}
      </Field>
      <fieldset>
        <legend className="text-sm font-semibold">Games</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {games.map((g) => {
            const checked = values.games.includes(g.id);
            return (
              <label key={g.id} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${checked ? "border-gold bg-gold/10 text-foreground" : "border-line text-muted-foreground"}`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => set("games", checked ? values.games.filter((id) => id !== g.id) : [...values.games, g.id])}
                />
                {g.shortName}
              </label>
            );
          })}
        </div>
      </fieldset>
      <Field label="About you" error={errors.bio}>
        {(id) => <textarea id={id} rows={4} className={inputClass} value={values.bio} onChange={(e) => set("bio", e.target.value)} />}
      </Field>
      <div className="grid gap-5 fold:grid-cols-2">
        <Field label="Instagram" hint="Handle only" error={errors.instagram}>
          {(id) => <input id={id} className={inputClass} value={values.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="yourshop" autoCapitalize="none" />}
        </Field>
        <Field label="Website" error={errors.website}>
          {(id) => <input id={id} type="url" className={inputClass} value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />}
        </Field>
      </div>
      <Field label="Contact email" hint="Only the MAV team sees this" error={errors.contactEmail}>
        {(id) => <input id={id} type="email" className={inputClass} value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} required />}
      </Field>
      {vendorDays.length > 0 && (
        <Field label="Request a table at" error={errors.eventId}>
          {(id) => (
            <select id={id} className={inputClass} value={values.eventId} onChange={(e) => set("eventId", e.target.value)}>
              <option value="">Just list me for now</option>
              {vendorDays.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} · {formatEventWhen(d.startsAt)}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
      {values.eventId && (
        <Field label="Anything we should know?" error={errors.message}>
          {(id) => <textarea id={id} rows={3} className={inputClass} value={values.message} onChange={(e) => set("message", e.target.value)} />}
        </Field>
      )}
      <Button type="submit" variant="gold" disabled={pending} className="w-full fold:w-auto">
        {existingStatus ? "Save" : "Send application"}
      </Button>
    </form>
  );
}
