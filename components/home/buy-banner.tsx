import { MapPin, Phone } from "lucide-react";
import { STORE_ADDRESS, STORE_PHONE } from "@lib/format";
import { buttonVariants } from "@components/ui/button";
import { cn } from "@utils";

const WANTED = ["Singles", "Graded slabs", "Sealed product", "Whole collections", "Vintage", "Bulk"];

/** "We buy your cards" call-out: a scrolling ticker over a comic panel. */
export function BuyBanner() {
  // Two copies side by side so the ticker loops without a gap.
  const ticker = [...WANTED, ...WANTED];
  return (
    <section aria-labelledby="buy-heading" className="buy-panel relative overflow-hidden rounded-2xl">
      <div aria-hidden className="buy-ticker overflow-hidden border-b-[3px] border-[#10222f] bg-[#10222f] py-1.5">
        <div className="buy-ticker-track flex w-max gap-6 whitespace-nowrap font-display text-base text-[#ffd02e]">
          {ticker.map((w, i) => (
            <span key={i} className="flex items-center gap-6">
              {w} <span className="text-[#e11d48]">★</span>
            </span>
          ))}
        </div>
      </div>
      <div className="relative flex flex-col gap-5 p-5 fold:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 id="buy-heading" className="font-display text-4xl leading-none text-white fold:text-6xl">
            We buy <span className="text-pop">your cards!</span>
          </h2>
          <p className="mt-3 text-base text-white/90 fold:text-lg">
            Cleaning out a binder or selling a whole collection? Bring it to the counter. We look through singles, slabs and sealed
            product and make you a fair offer, or work out a trade.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 fold:flex-row lg:flex-col">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(STORE_ADDRESS)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            <MapPin aria-hidden />
            Get directions
          </a>
          <a href={`tel:${STORE_PHONE.replace(/\D/g, "")}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white text-[#10222f] hover:bg-white/90")}>
            <Phone aria-hidden />
            {STORE_PHONE}
          </a>
        </div>
      </div>
    </section>
  );
}
