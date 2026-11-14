import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { VendorCard } from "@components/hub/vendor-card";
import { EventCard } from "@components/hub/event-card";
import { listEvents, listVendors } from "@lib/data/hub";
import { Skeleton } from "@components/ui/skeleton";
import { LinkButton } from "@components/ui/link-button";

export const metadata: Metadata = {
  title: "Vendors",
  description: "Vendors who visit MAV Collectibles to sell and trade cards, and upcoming vendor days.",
};

async function VendorDays() {
  const days = await listEvents({ kind: "vendor_day", limit: 6 });
  if (days.length === 0) return null;
  return (
    <section className="mb-10" aria-labelledby="vendor-days">
      <h2 id="vendor-days" className="mb-3 text-lg font-bold">Upcoming vendor days</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {days.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}

async function VendorGrid() {
  const vendors = await listVendors();
  if (vendors.length === 0) {
    return <EmptyState title="No vendors listed yet" description="Want a table at our next vendor day? Apply below." />;
  }
  return (
    <div className="grid gap-3 fold:grid-cols-2 lg:grid-cols-3">
      {vendors.map((v) => (
        <VendorCard key={v.id} vendor={v} />
      ))}
    </div>
  );
}

export default function VendorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Buy · Sell · Trade"
        title="Vendors"
        description="Collectors and shops who set up at MAV to sell and trade. Bring your binder."
        actions={
          <LinkButton href="/vendors/apply" size="sm">
            Apply for a table
          </LinkButton>
        }
      />
      <Suspense fallback={null}>
        <VendorDays />
      </Suspense>
      <h2 className="mb-3 text-lg font-bold">Vendor directory</h2>
      <Suspense fallback={<Skeleton className="h-40" />}>
        <VendorGrid />
      </Suspense>
    </>
  );
}
