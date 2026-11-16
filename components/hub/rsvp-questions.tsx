"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { Field, inputClass } from "@components/ui/field";
import { FileCheck2, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { startAnswerUpload } from "@lib/actions/hub";
import { UPLOAD_BUCKET, UPLOAD_MAX_BYTES, UPLOAD_TYPES, checkAnswers, type Answers, type EventQuestion } from "@lib/event-questions";
import { getBrowserClient } from "@utils/supabase/client";
import { cn } from "@utils";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Month and year as two menus: works the same in every browser, and is quick for a birth date. */
function MonthField({ id, value, invalid, onChange }: { id: string; value: string; invalid: boolean; onChange: (value: string) => void }) {
  const [year = "", month = ""] = value.split("-");
  const thisYear = new Date().getFullYear();
  // Both halves are kept while the other is still empty ("-03" or "2011-"), and only a full value passes the check.
  const update = (nextYear: string, nextMonth: string) => onChange(nextYear || nextMonth ? `${nextYear}-${nextMonth}` : "");
  return (
    <div className="grid grid-cols-2 gap-2">
      <select id={id} aria-label="Month" aria-invalid={invalid} className={inputClass} value={month} onChange={(e) => update(year, e.target.value)}>
        <option value="">Month</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={String(i + 1).padStart(2, "0")}>
            {name}
          </option>
        ))}
      </select>
      <select aria-label="Year" aria-invalid={invalid} className={inputClass} value={year} onChange={(e) => update(e.target.value, month)}>
        <option value="">Year</option>
        {Array.from({ length: 100 }, (_, i) => String(thisYear - i)).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Uploads straight to private storage through a one-time link, then remembers where the file went. */
function FileField({ id, eventId, questionId, value, onChange }: { id: string; eventId: string; questionId: string; value: string; onChange: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!UPLOAD_TYPES[file.type]) return void toast.error("Upload a PDF or a photo (JPG, PNG, WebP or HEIC).");
    if (file.size > UPLOAD_MAX_BYTES) return void toast.error("That file is larger than 10 MB.");
    setUploading(true);
    try {
      const started = await startAnswerUpload({ eventId, questionId, contentType: file.type, size: file.size });
      if (!started.ok) return void toast.error(started.error);
      const supabase = await getBrowserClient();
      const { error } = await supabase.storage.from(UPLOAD_BUCKET).uploadToSignedUrl(started.data.path, started.data.token, file, { contentType: file.type });
      if (error) return void toast.error("The upload didn't finish. Check your connection and try again.");
      setName(file.name);
      onChange(started.data.path);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 text-sm font-semibold hover:border-gold", uploading && "pointer-events-none opacity-60")}>
        {uploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}
        {uploading ? "Uploading…" : value ? "Replace file" : "Choose a file"}
        <input id={id} type="file" accept={Object.keys(UPLOAD_TYPES).join(",")} className="sr-only" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} />
      </label>
      {value && !uploading && (
        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-success">
          <FileCheck2 aria-hidden className="size-4 shrink-0" />
          <span className="truncate">{name || "File uploaded"}</span>
        </span>
      )}
    </div>
  );
}

/** The event's questions, answered as part of an RSVP (or edited afterwards). */
export function RsvpQuestions({
  eventId,
  questions,
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  eventId: string;
  questions: EventQuestion[];
  initial: Answers;
  submitLabel: string;
  pending: boolean;
  onSubmit: (answers: Answers) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Answers>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (id: string, value: string) => setValues((cur) => ({ ...cur, [id]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = checkAnswers(questions, values);
    setErrors(checked.errors);
    if (Object.keys(checked.errors).length === 0) onSubmit(checked.answers);
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Player details" className={cn(cardVariants({ padding: "md" }), "w-full space-y-4")}>
      <div>
        <h2 className="text-base font-bold">A few details for this event</h2>
        <p className="text-xs text-muted-foreground">Only the MAV team sees your answers.</p>
      </div>
      {questions.map((q) => (
        <Field
          key={q.id}
          label={q.required ? q.label : `${q.label} (optional)`}
          hint={[q.help, q.autofill === "playerId" ? (initial[q.id] ? "Filled in from your profile." : "We'll save this to your profile for next time.") : ""].filter(Boolean).join(" ") || undefined}
          error={errors[q.id]}
        >
          {(id) => {
            const common = { id, value: values[q.id] ?? "", "aria-required": q.required, "aria-invalid": Boolean(errors[q.id]) };
            if (q.type === "month") return <MonthField id={id} value={values[q.id] ?? ""} invalid={Boolean(errors[q.id])} onChange={(v) => set(q.id, v)} />;
            if (q.type === "file") return <FileField id={id} eventId={eventId} questionId={q.id} value={values[q.id] ?? ""} onChange={(v) => set(q.id, v)} />;
            if (q.type === "long") return <textarea {...common} rows={5} className={inputClass} onChange={(e) => set(q.id, e.target.value)} />;
            if (q.type === "choice" || q.type === "yesno") {
              const options = q.type === "yesno" ? ["Yes", "No"] : q.options;
              return (
                <select {...common} className={inputClass} onChange={(e) => set(q.id, e.target.value)}>
                  <option value="">Choose…</option>
                  {options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              );
            }
            return (
              <input
                {...common}
                type={q.type === "date" ? "date" : "text"}
                autoComplete="off"
                inputMode={q.type === "number" ? "numeric" : undefined}
                className={inputClass}
                onChange={(e) => set(q.id, e.target.value)}
              />
            );
          }}
        </Field>
      ))}
      <div className="flex flex-col gap-2 fold:flex-row">
        <Button type="submit" variant="gold" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Not now
        </Button>
      </div>
    </form>
  );
}
