import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AtSign, Globe } from "lucide-react";
import { getVendor } from "@lib/data/hub";
import { VendorAvatar } from "@components/hub/vendor-card";
import { GameBadge } from "@components/hub/badges";
import { formatEventWhen } from "@lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const vendor = await getVendor((await params).slug);
  return vendor ? { title: vendor.name, description: vendor.bio.slice(0, 160) } : { title: "Vendor not found" };
}

async function VendorContent({ params }: { params: Params }) {
  const vendor = await getVendor((await params).slug);
  if (!vendor) notFound();
  return (
    <article className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <VendorAvatar vendor={vendor} size={72} />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold fold:text-3xl">{vendor.name}</h1>
          {vendor.specialties && <p className="text-muted-foreground">{vendor.specialties}</p>}
        </div>
      </div>
      {vendor.games.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {vendor.games.map((g) => (
            <GameBadge key={g.id} game={g} />
          ))}
        </div>
      )}
      {vendor.bio && <p className="mt-5 whitespace-pre-line leading-relaxed text-foreground/90">{vendor.bio}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {vendor.instagram && (
          <a href={`https://instagram.com/${vendor.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm hover:border-gold/60">
            <AtSign className="size-4" /> @{vendor.instagram}
          </a>
        )}
        {vendor.website && (
          <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm hover:border-gold/60">
            <Globe className="size-4" /> Website
          </a>
        )}
      </div>
      <section className="mt-8">
        <h2 className="text-lg font-bold">Upcoming visits</h2>
        {vendor.upcomingEvents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No visits scheduled right now.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {vendor.upcomingEvents.map((e) => (
              <li key={e.slug}>
                <Link href={`/events/${e.slug}`} className="block rounded-lg border border-line bg-panel px-4 py-3 hover:border-gold/50">
                  <span className="block font-semibold">{e.title}</span>
                  <span className="text-sm text-muted-foreground">{formatEventWhen(e.startsAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

export default function VendorPage({ params }: { params: Params }) {
  return (
    <>
      <nav className="mb-4 text-sm">
        <Link href="/vendors" className="text-muted-foreground hover:text-gold">← All vendors</Link>
      </nav>
      <Suspense fallback={<div className="mx-auto h-48 max-w-2xl animate-pulse rounded-xl bg-panel" />}>
        <VendorContent params={params} />
      </Suspense>
    </>
  );
}
