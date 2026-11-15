import { Clock, MapPin, Phone } from "lucide-react";
import { STORE_ADDRESS, STORE_PHONE } from "@lib/format";
import { cardVariants } from "@components/ui/card";
import { buttonVariants } from "@components/ui/button";
import { cn } from "@utils";

const HOURS = [
  { day: "Monday", hours: "Closed" },
  { day: "Tuesday to Thursday", hours: "12 PM to 9 PM" },
  { day: "Friday and Saturday", hours: "12 PM to 10 PM" },
  { day: "Sunday", hours: "12 PM to 9 PM" },
];

/** Address, hours, phone and directions: the things someone needs to walk in. */
export function VisitBlock({ heading = "Visit the shop" }: { heading?: string }) {
  const maps = `https://maps.google.com/?q=${encodeURIComponent(`MAV Collectibles, ${STORE_ADDRESS}`)}`;
  return (
    <section className={cn(cardVariants({ padding: "lg" }))}>
      <h2 className="font-display text-2xl">{heading}</h2>
      <div className="mt-3 grid gap-5 fold:grid-cols-2">
        <div className="space-y-3">
          <p className="flex gap-2">
            <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
            <span>
              MAV Collectibles
              <br />
              {STORE_ADDRESS}
            </span>
          </p>
          <p className="flex gap-2">
            <Phone aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
            <a className="font-semibold text-gold" href={`tel:${STORE_PHONE.replace(/\D/g, "")}`}>{STORE_PHONE}</a>
          </p>
          <a href={maps} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
            Get directions
          </a>
        </div>
        <div className="flex gap-2">
          <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
          <dl className="grid flex-1 grid-cols-[1fr_auto] gap-x-4 gap-y-1">
            {HOURS.map((h) => (
              <div key={h.day} className="contents">
                <dt className="text-foreground/85">{h.day}</dt>
                <dd className="font-semibold">{h.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
