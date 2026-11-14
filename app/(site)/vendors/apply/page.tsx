import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@components/ui/page-header";
import { VendorApplyForm } from "@components/hub/vendor-apply-form";
import { getCurrentUser } from "@lib/auth/server";
import { getMyVendor, listEvents, listGames } from "@lib/data/hub";
import { Skeleton } from "@components/ui/skeleton";

export const metadata: Metadata = { title: "Apply for a vendor table" };

async function ApplyForm() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/vendors/apply");
  const [games, days, mine] = await Promise.all([listGames(), listEvents({ kind: "vendor_day", limit: 10 }), getMyVendor(user.id)]);
  return (
    <VendorApplyForm
      games={games}
      vendorDays={days.filter((d) => d.status === "published").map((d) => ({ id: d.id, title: d.title, startsAt: d.startsAt }))}
      existingStatus={mine?.status ?? null}
      defaults={{
        name: mine?.name ?? "",
        bio: mine?.bio ?? "",
        specialties: mine?.specialties ?? "",
        games: mine?.games ?? ["pokemon"],
        instagram: mine?.instagram ?? "",
        website: mine?.website ?? "",
        contactEmail: mine?.contact_email ?? user.email ?? "",
      }}
    />
  );
}

export default function VendorApplyPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader eyebrow="Vendors" title="Apply for a table" description="Tell us what you bring. The MAV team reviews every application." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ApplyForm />
      </Suspense>
    </div>
  );
}
