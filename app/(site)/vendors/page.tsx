import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, EmptyState } from "@components/hub/page-header";
import { VendorCard } from "@components/hub/vendor-card";
import { EventCard } from "@components/hub/event-card";
import { listEvents, listVendors } from "@lib/data/hub";

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
          <Link href="/vendors/apply" className="inline-flex min-h-10 items-center rounded-md bg-gold px-4 text-sm font-bold text-ink hover:bg-gold-light">
            Apply for a table
          </Link>
        }
      />
      <Suspense fallback={null}>
        <VendorDays />
      </Suspense>
      <h2 className="mb-3 text-lg font-bold">Vendor directory</h2>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-panel" />}>
        <VendorGrid />
      </Suspense>
    </>
  );
}
