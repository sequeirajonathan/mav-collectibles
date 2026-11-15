"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { Field, inputClass } from "@components/ui/field";
import { ConfirmButton } from "@components/admin/confirm-button";
import { deleteStaffRequest, submitStaffRequest, updateStaffRequest } from "@lib/actions/requests";
import {
  KIND_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  requestKindSchema,
  requestPrioritySchema,
  requestStatusSchema,
  type RequestKind,
  type RequestPriority,
  type RequestStatus,
  type StaffRequest,
} from "@lib/contracts/requests";
import { formatShortDate } from "@lib/format";
import { cn } from "@utils";

/** "Ask for something" form, shown to everyone with admin panel access. */
export function RequestForm() {
  const router = useRouter();
  const [kind, setKind] = useState<RequestKind>("feature");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [page, setPage] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitStaffRequest({ kind, title, details, page, urgent });
      if (!result.ok) {
        setErrors("fieldErrors" in result && result.fieldErrors ? result.fieldErrors : {});
        return void toast.error(result.error);
      }
      setErrors({});
      setTitle("");
      setDetails("");
      setPage("");
      setUrgent(false);
      toast.success("Sent. You can follow it in the list below.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className={cn(cardVariants({ padding: "lg" }), "space-y-4")}>
      <h2 className="text-lg font-bold">Ask for something</h2>
      <fieldset>
        <legend className="text-sm font-semibold">What is it?</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {requestKindSchema.options.map((k) => (
            <label
              key={k}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold",
                kind === k ? "border-gold bg-gold text-ink" : "border-line bg-panel text-muted-foreground"
              )}
            >
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {KIND_LABEL[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Title" hint="One line: what do you want, or what went wrong?" error={errors.title}>
        {(id) => <input id={id} required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />}
      </Field>
      <Field
        label="Details"
        hint={kind === "bug" ? "What did you do, what did you expect, and what happened instead?" : "Who is it for and what should it do?"}
        error={errors.details}
      >
        {(id) => <textarea id={id} rows={4} maxLength={4000} value={details} onChange={(e) => setDetails(e.target.value)} className={inputClass} />}
      </Field>
      <Field label="Where on the site? (optional)" hint="A page name or a link." error={errors.page}>
        {(id) => <input id={id} maxLength={300} value={page} onChange={(e) => setPage(e.target.value)} className={inputClass} />}
      </Field>
      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="size-5 accent-[var(--gold)]" />
        This is urgent (it is costing sales or blocking staff)
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}

const STATUS_BADGE: Record<RequestStatus, "neutral" | "gold" | "success" | "outline"> = {
  new: "neutral",
  planned: "gold",
  in_progress: "gold",
  done: "success",
  declined: "outline",
};

/** One request. Admins get the controls to move it along and reply. */
export function RequestCard({ request, isAdmin, isMine }: { request: StaffRequest; isAdmin: boolean; isMine: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [priority, setPriority] = useState<RequestPriority>(request.priority);
  const [response, setResponse] = useState(request.response);
  const [pending, startTransition] = useTransition();
  const changed = status !== request.status || priority !== request.priority || response !== request.response;

  const save = () =>
    startTransition(async () => {
      const result = await updateStaffRequest({ id: request.id, status, priority, response });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Saved");
      router.refresh();
    });
  const remove = () =>
    startTransition(async () => {
      const result = await deleteStaffRequest({ id: request.id });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Removed");
      router.refresh();
    });

  return (
    <article className={cn(cardVariants({ padding: "md" }), "space-y-3")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={STATUS_BADGE[request.status]}>{STATUS_LABEL[request.status]}</Badge>
        <Badge variant={request.kind === "bug" ? "danger" : "outline"}>{KIND_LABEL[request.kind]}</Badge>
        {request.priority === "high" && <Badge variant="danger">Urgent</Badge>}
      </div>
      <div>
        <h3 className="font-bold leading-snug">{request.title}</h3>
        <p className="text-sm text-muted-foreground">
          {request.createdByName} · {formatShortDate(request.createdAt)}
          {request.completedAt && <> · finished {formatShortDate(request.completedAt)}</>}
        </p>
      </div>
      {request.details && <p className="whitespace-pre-wrap text-sm text-foreground/90">{request.details}</p>}
      {request.page && (
        <p className="text-sm text-muted-foreground">
          Where: <span className="text-foreground/90">{request.page}</span>
        </p>
      )}
      {!isAdmin && request.response && (
        <p className={cn(cardVariants({ variant: "accent", padding: "sm" }), "whitespace-pre-wrap text-sm")}>
          <span className="font-semibold">Reply: </span>
          {request.response}
        </p>
      )}
      {isAdmin && (
        <div className="space-y-3 border-t border-line pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              {(id) => (
                <select id={id} value={status} onChange={(e) => setStatus(requestStatusSchema.parse(e.target.value))} className={inputClass}>
                  {requestStatusSchema.options.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Priority">
              {(id) => (
                <select id={id} value={priority} onChange={(e) => setPriority(requestPrioritySchema.parse(e.target.value))} className={inputClass}>
                  {requestPrioritySchema.options.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="Reply" hint="What was done, or why not. The person who asked sees this.">
            {(id) => <textarea id={id} rows={2} maxLength={2000} value={response} onChange={(e) => setResponse(e.target.value)} className={inputClass} />}
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button size="sm" disabled={pending || !changed} onClick={save}>
              Save
            </Button>
            <ConfirmButton label="Delete" confirmLabel="Yes, delete" onConfirm={remove} disabled={pending} />
          </div>
        </div>
      )}
      {!isAdmin && isMine && request.status === "new" && <ConfirmButton label="Withdraw" confirmLabel="Yes, withdraw" onConfirm={remove} disabled={pending} />}
    </article>
  );
}
