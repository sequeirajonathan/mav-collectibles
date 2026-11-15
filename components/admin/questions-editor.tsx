"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { Field, inputClass } from "@components/ui/field";
import { MAX_QUESTIONS, QUESTION_PRESETS, QUESTION_TYPES, QUESTION_TYPE_LABELS, newQuestionId, type EventQuestion, type QuestionType } from "@lib/event-questions";
import { cn } from "@utils";

/** Staff choose what to ask players when they RSVP. */
export function QuestionsEditor({ value, onChange, error }: { value: EventQuestion[]; onChange: (next: EventQuestion[]) => void; error?: string }) {
  const full = value.length >= MAX_QUESTIONS;
  const update = (id: string, patch: Partial<EventQuestion>) => onChange(value.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const move = (index: number, by: -1 | 1) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + by, 0, item);
    onChange(next);
  };
  const add = (questions: Omit<EventQuestion, "id">[]) =>
    onChange([...value, ...questions.map((q) => ({ ...q, id: newQuestionId() }))].slice(0, MAX_QUESTIONS));

  return (
    <fieldset>
      <legend className="text-sm font-semibold">Questions for players</legend>
      <p className="text-xs text-muted-foreground">Asked when someone RSVPs. Answers show on the attendee list, so there&apos;s no separate form to keep in step.</p>
      {value.length > 0 && (
        <ol className="mt-3 space-y-3">
          {value.map((q, index) => (
            <li key={q.id} className={cn(cardVariants({ padding: "md" }), "space-y-3")}>
              <div className="grid gap-3 fold:grid-cols-[2fr_1fr]">
                <Field label={`Question ${index + 1}`}>
                  {(id) => <input id={id} maxLength={120} className={inputClass} value={q.label} onChange={(e) => update(q.id, { label: e.target.value })} />}
                </Field>
                <Field label="Answer type">
                  {(id) => (
                    <select id={id} className={inputClass} value={q.type} onChange={(e) => update(q.id, { type: e.target.value as QuestionType })}>
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {QUESTION_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <Field label="Helper text (optional)">
                {(id) => <input id={id} maxLength={200} className={inputClass} value={q.help} onChange={(e) => update(q.id, { help: e.target.value })} />}
              </Field>
              {q.type === "choice" && (
                <Field label="Choices" hint="One per line">
                  {(id) => (
                    <textarea
                      id={id}
                      rows={3}
                      className={inputClass}
                      defaultValue={q.options.join("\n")}
                      onChange={(e) => update(q.id, { options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean).slice(0, 12) })}
                    />
                  )}
                </Field>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label className="mr-auto flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" className="size-5 accent-[var(--gold)]" checked={q.required} onChange={(e) => update(q.id, { required: e.target.checked })} />
                  Required
                </label>
                <Button type="button" variant="ghost" size="icon" aria-label={`Move question ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Move question ${index + 1} down`} disabled={index === value.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove question ${index + 1}`} onClick={() => onChange(value.filter((x) => x.id !== q.id))}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={full} onClick={() => add([{ label: "", help: "", type: "text", required: false, options: [] }])}>
          <Plus aria-hidden /> Add a question
        </Button>
        {QUESTION_PRESETS.map((preset) => (
          <Button key={preset.label} type="button" variant="outline" size="sm" disabled={full} onClick={() => add(preset.questions)}>
            <Plus aria-hidden /> {preset.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
