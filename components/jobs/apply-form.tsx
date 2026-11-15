"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { Field, inputClass } from "@components/ui/field";
import { JOB_POSITIONS, RESUME_MAX_BYTES, RESUME_TYPES } from "@const/jobs";
import { cn } from "@utils";

export function ApplyForm() {
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const resume = data.get("resume");
    if (resume instanceof File && resume.size > 0) {
      if (!(resume.type in RESUME_TYPES)) return setError("Résumés must be a PDF or Word document.");
      if (resume.size > RESUME_MAX_BYTES) return setError("Résumés must be 4 MB or smaller.");
    }
    setBusy(true);
    try {
      const response = await fetch("/api/v1/job-applications", { method: "POST", body: data });
      if (response.ok) {
        setSent(true);
      } else {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object" && "message" in body.error
            ? String(body.error.message)
            : null;
        setError(message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("We couldn't reach the shop's site. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className={cn(cardVariants({ padding: "lg" }), "text-center")}>
        <Image src="/images/lucario.gif" alt="" width={47} height={63} unoptimized className="pixelated animate-bob mx-auto h-24 w-auto" />
        <CheckCircle2 aria-hidden className="mx-auto mt-3 size-8 text-success" />
        <h2 className="mt-3 text-xl font-bold">Application sent</h2>
        <p className="mt-1 text-muted-foreground">Thanks for applying. We read every application and will reach out if it&apos;s a fit.</p>
      </div>
    );
  }

  return (
    <form ref={form} onSubmit={submit} className={cn(cardVariants({ padding: "lg" }), "space-y-4")} noValidate={false}>
      <h2 className="text-xl font-bold">Apply online</h2>
      <Field label="Position">
        {(id) => (
          <select id={id} name="position" required defaultValue={JOB_POSITIONS[0]} className={inputClass}>
            {JOB_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </Field>
      <div className="grid gap-4 fold:grid-cols-2">
        <Field label="Full name">{(id) => <input id={id} name="name" required minLength={2} maxLength={120} autoComplete="name" className={inputClass} />}</Field>
        <Field label="Email">{(id) => <input id={id} name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} />}</Field>
      </div>
      <div className="grid gap-4 fold:grid-cols-2">
        <Field label="Phone (optional)">{(id) => <input id={id} name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />}</Field>
        <Field label="When can you work? (optional)">
          {(id) => <input id={id} name="availability" maxLength={500} placeholder="Weekends, evenings after 4…" className={inputClass} />}
        </Field>
      </div>
      <Field label="Tell us about yourself" hint="Which games you know, any shop or TCGplayer experience, and why MAV.">
        {(id) => <textarea id={id} name="message" rows={5} maxLength={4000} className={inputClass} />}
      </Field>
      <Field label="Résumé (optional)" hint="PDF or Word, up to 4 MB.">
        {(id) => (
          <input
            id={id}
            name="resume"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className={cn(inputClass, "file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground")}
          />
        )}
      </Field>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Sending…" : "Send application"}
      </Button>
      <p className="text-xs text-muted-foreground">
        We only use this to consider you for a job. See our <a href="/privacy" className="text-gold underline-offset-2 hover:underline">privacy policy</a>.
      </p>
    </form>
  );
}
