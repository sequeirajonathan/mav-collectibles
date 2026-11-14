"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { setVendorStatus, setVendorTable } from "@lib/actions/hub";
import { formatEventWhen } from "@lib/format";
import { VendorAvatar } from "@components/hub/vendor-card";
import type { Vendor } from "@lib/contracts/hub";

type StaffVendor = Vendor & {
  contactEmail: string | null;
  requests: { eventId: string; eventTitle: string; startsAt: string; status: "requested" | "confirmed" | "declined"; message: string | null; tableLabel: string | null }[];
};

function TableRequest({ vendorId, request }: { vendorId: string; request: StaffVendor["requests"][number] }) {
  const router = useRouter();
  const [label, setLabel] = useState(request.tableLabel ?? "");
  const [pending, startTransition] = useTransition();
  const decide = (status: "confirmed" | "declined") =>
    startTransition(async () => {
      const result = await setVendorTable({ eventId: request.eventId, vendorId, status, tableLabel: label || null });
      if (!result.ok) return void toast.error(result.error);
      toast.success(status === "confirmed" ? "Table confirmed" : "Request declined");
      router.refresh();
    });
  return (
    <li className="rounded-lg border border-line p-3 text-sm">
      <p className="font-semibold">{request.eventTitle}</p>
      <p className="text-muted-foreground">{formatEventWhen(request.startsAt)} · <span className="capitalize">{request.status}</span></p>
      {request.message && <p className="mt-1 italic text-foreground/80">“{request.message}”</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`table-${vendorId}-${request.eventId}`}>Table</label>
        <input id={`table-${vendorId}-${request.eventId}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Table #" className="min-h-10 w-24 rounded-md border border-line bg-panel-2 px-2 text-base" />
        <Button size="sm" variant="gold" disabled={pending} onClick={() => decide("confirmed")}>Confirm</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => decide("declined")}>Decline</Button>
      </div>
    </li>
  );
}

export function VendorReview({ vendor }: { vendor: StaffVendor }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const setStatus = (status: "approved" | "rejected" | "pending") =>
    startTransition(async () => {
      const result = await setVendorStatus({ id: vendor.id, status });
      if (!result.ok) return void toast.error(result.error);
      router.refresh();
    });
  return (
    <article className="rounded-xl border border-line bg-panel p-4">
      <div className="flex items-start gap-3">
        <VendorAvatar vendor={vendor} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{vendor.name}</h3>
          <p className="text-sm text-muted-foreground">
            <span className="capitalize">{vendor.status}</span>
            {vendor.contactEmail && <> · <a className="text-gold" href={`mailto:${vendor.contactEmail}`}>{vendor.contactEmail}</a></>}
          </p>
          {vendor.specialties && <p className="mt-1 text-sm">{vendor.specialties}</p>}
          {vendor.bio && <p className="mt-1 line-clamp-3 text-sm text-foreground/80">{vendor.bio}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {vendor.status !== "approved" && <Button size="sm" variant="gold" disabled={pending} onClick={() => setStatus("approved")}>Approve</Button>}
        {vendor.status !== "rejected" && <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("rejected")}>Reject</Button>}
        {vendor.status !== "pending" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("pending")}>Back to pending</Button>}
      </div>
      {vendor.requests.length > 0 && (
        <ul className="mt-3 grid gap-2 fold:grid-cols-2">
          {vendor.requests.map((r) => <TableRequest key={r.eventId} vendorId={vendor.id} request={r} />)}
        </ul>
      )}
    </article>
  );
}
