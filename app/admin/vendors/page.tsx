import { Suspense } from "react";
import { PageHeader, EmptyState } from "@components/hub/page-header";
import { VendorReview } from "@components/admin/vendor-review";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { listVendorsForStaff } from "@lib/data/hub";

async function List() {
  await requirePageRole(CONTENT_ROLES, "/admin/vendors");
  const vendors = await listVendorsForStaff();
  if (vendors.length === 0) return <EmptyState title="No vendor applications yet" description="Share mavcollectibles.com/vendors/apply with vendors you'd like to host." />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {vendors.map((v) => <VendorReview key={v.id} vendor={v} />)}
    </div>
  );
}

export default function AdminVendorsPage() {
  return (
    <>
      <PageHeader title="Vendors" description="Approve vendor profiles and confirm tables for vendor days." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-panel" />}>
        <List />
      </Suspense>
    </>
  );
}
