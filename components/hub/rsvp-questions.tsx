"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { Field, inputClass } from "@components/ui/field";
import { checkAnswers, type Answers, type EventQuestion } from "@lib/event-questions";
import { cn } from "@utils";

/** The event's questions, answered as part of an RSVP (or edited afterwards). */
export function RsvpQuestions({
  questions,
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
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
        <Field key={q.id} label={q.required ? q.label : `${q.label} (optional)`} hint={q.help || undefined} error={errors[q.id]}>
          {(id) => {
            const common = { id, value: values[q.id] ?? "", "aria-required": q.required, "aria-invalid": Boolean(errors[q.id]) };
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
