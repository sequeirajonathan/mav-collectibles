"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FileText } from "lucide-react";
import { Badge } from "@components/ui/badge";
import { Button, buttonVariants } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { Field, inputClass } from "@components/ui/field";
import { ConfirmButton } from "@components/admin/confirm-button";
import { deleteJobApplication, updateJobApplication } from "@lib/actions/jobs";
import { APPLICATION_STATUS_LABEL, applicationStatusSchema, type ApplicationStatus, type JobApplication } from "@lib/contracts/jobs";
import { formatShortDate } from "@lib/format";
import { cn } from "@utils";

export function ApplicationCard({ application, isAdmin }: { application: JobApplication; isAdmin: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.notes);
  const [pending, startTransition] = useTransition();
  const changed = status !== application.status || notes !== application.notes;

  const save = () =>
    startTransition(async () => {
      const result = await updateJobApplication({ id: application.id, status, notes });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Saved");
      router.refresh();
    });
  const remove = () =>
    startTransition(async () => {
      const result = await deleteJobApplication({ id: application.id });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Deleted");
      router.refresh();
    });

  return (
    <article className={cn(cardVariants({ padding: "md" }), "space-y-3")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="gold">{application.position}</Badge>
        <span className="text-sm text-muted-foreground">{formatShortDate(application.createdAt)}</span>
      </div>
      <div>
        <h3 className="text-lg font-bold leading-snug">{application.name}</h3>
        <p className="text-sm">
          <a className="text-gold" href={`mailto:${application.email}`}>{application.email}</a>
          {application.phone && (
            <>
              {" · "}
              <a className="text-gold" href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}>{application.phone}</a>
            </>
          )}
        </p>
      </div>
      {application.availability && (
        <p className="text-sm">
          <span className="font-semibold">Availability: </span>
          {application.availability}
        </p>
      )}
      {application.message && <p className="whitespace-pre-wrap text-sm text-foreground/90">{application.message}</p>}
      {application.resumeName ? (
        <a
          href={`/api/v1/job-applications/${application.id}/resume`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FileText aria-hidden /> Open résumé
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">No résumé attached.</p>
      )}
      <div className="space-y-3 border-t border-line pt-3">
        <Field label="Status">
          {(id) => (
            <select id={id} value={status} onChange={(e) => setStatus(applicationStatusSchema.parse(e.target.value))} className={inputClass}>
              {applicationStatusSchema.options.map((s) => (
                <option key={s} value={s}>
                  {APPLICATION_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Notes" hint="Only staff see these.">
          {(id) => <textarea id={id} rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />}
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button size="sm" disabled={pending || !changed} onClick={save}>
            Save
          </Button>
          {isAdmin && <ConfirmButton label="Delete" confirmLabel="Yes, delete for good" onConfirm={remove} disabled={pending} />}
        </div>
      </div>
    </article>
  );
}
