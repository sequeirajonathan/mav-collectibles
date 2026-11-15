import Image from "next/image";
import Link from "next/link";
import type { Vendor } from "@lib/contracts/hub";
import { formatEventWhen } from "@lib/format";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";
import { GameBadge } from "./badges";

export function VendorAvatar({ vendor, size = 48 }: { vendor: Pick<Vendor, "name" | "logoUrl">; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-panel-2 font-bold text-gold" style={{ width: size, height: size }}>
      {vendor.logoUrl ? <Image src={vendor.logoUrl} alt="" fill sizes={`${size}px`} className="object-cover" /> : vendor.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const next = vendor.upcomingEvents[0];
  return (
    <Link href={`/vendors/${vendor.slug}`} className={cn(cardVariants({ variant: "interactive", padding: "md" }), "group flex flex-col gap-3")}>
      <div className="flex items-center gap-3">
        <VendorAvatar vendor={vendor} />
        <div className="min-w-0">
          <h3 className="truncate font-bold text-foreground can-hover:group-hover:text-gold-light">{vendor.name}</h3>
          {vendor.specialties && <p className="line-clamp-1 text-sm text-muted-foreground">{vendor.specialties}</p>}
        </div>
      </div>
      {vendor.games.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {vendor.games.map((g) => (
            <GameBadge key={g.id} game={g} />
          ))}
        </div>
      )}
      {next && (
        <p className="text-sm text-gold">
          Next visit: <span className="text-foreground">{formatEventWhen(next.startsAt)}</span>
        </p>
      )}
    </Link>
  );
}
