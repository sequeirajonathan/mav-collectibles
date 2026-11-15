import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import { STORE_ADDRESS, STORE_PHONE } from "@lib/format";
import { listCategory } from "@lib/data/catalog";
import { buttonVariants } from "@components/ui/button";
import { cn } from "@utils";

/** What we buy, shown as real stock from the matching shop categories. */
const SOURCES = [
  { slug: "psa", label: "Graded slab" },
  { slug: "pokemonsingles", label: "Raw single" },
  { slug: "pokemon", label: "Sealed" },
  { slug: "cgc", label: "Graded slab" },
  { slug: "onepiecesingles", label: "Raw single" },
  { slug: "magicsingles", label: "Raw single" },
] as const;
const WANTED = ["Singles", "Graded slabs", "Sealed product", "Whole collections", "Vintage", "Bulk"];
const PER_SOURCE = 4;
/** The wheel needs enough cards to close the circle. */
const MIN_CARDS = 6;
const WHEEL_SIZE = 30;

interface WheelCard {
  src: string;
  label: string;
}

async function wheelCards(): Promise<WheelCard[]> {
  const lists = await Promise.all(
    SOURCES.map(async (source) => {
      try {
        const page = await listCategory(source.slug, undefined, { stock: "IN_STOCK", sort: "name_asc", limit: 12 });
        return (page?.items ?? [])
          .flatMap((item) => (item.imageUrls?.[0] ? [{ src: item.imageUrls[0], label: source.label }] : []))
          .slice(0, PER_SOURCE);
      } catch {
        // The banner still works without photos.
        return [];
      }
    })
  );
  // Deal one from each pile in turn so slabs, singles and sealed alternate.
  const cards: WheelCard[] = [];
  for (let i = 0; i < PER_SOURCE; i++) for (const list of lists) if (list[i]) cards.push(list[i]);
  if (cards.length < MIN_CARDS) return [];
  return Array.from({ length: WHEEL_SIZE }, (_, i) => cards[i % cards.length]);
}

function Wheel({ cards }: { cards: WheelCard[] }) {
  return (
    <div aria-hidden className="wheel relative h-44 overflow-hidden border-b-[3px] border-[#10222f] bg-[#10222f] fold:h-52" style={{ "--n": cards.length } as React.CSSProperties}>
      <div className="wheel-ring">
        {cards.map((card, i) => (
          <div key={i} className="wheel-item" style={{ "--i": i } as React.CSSProperties}>
            <div className="relative aspect-[5/7] overflow-hidden rounded-lg border-2 border-[#10222f] bg-white">
              <Image src={card.src} alt="" fill sizes="(min-width: 576px) 240px, 208px" className="object-contain p-1" />
            </div>
            <p className="mt-1 text-center font-display text-sm leading-none text-[#ffd02e]">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Ticker() {
  // Two copies side by side so the strip loops without a gap.
  const words = [...WANTED, ...WANTED];
  return (
    <div aria-hidden className="overflow-hidden border-b-[3px] border-[#10222f] bg-[#10222f] py-1.5">
      <div className="buy-ticker-track flex w-max gap-6 whitespace-nowrap font-display text-base text-[#ffd02e]">
        {words.map((w, i) => (
          <span key={i} className="flex items-center gap-6">
            {w} <span className="text-[#e11d48]">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** "We buy your cards" call-out: a turning wheel of real stock over a comic panel. */
export async function BuyBanner() {
  const cards = await wheelCards();
  return (
    <section aria-labelledby="buy-heading" className="buy-panel relative overflow-hidden rounded-2xl">
      {cards.length > 0 ? <Wheel cards={cards} /> : <Ticker />}
      <div className="relative flex flex-col gap-5 p-5 fold:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 id="buy-heading" className="font-display text-4xl leading-none text-white fold:text-6xl">
            We buy <span className="text-pop">your cards!</span>
          </h2>
          <p className="mt-3 text-base text-white/90 fold:text-lg">
            Cleaning out a binder or selling a whole collection? Bring it to the counter. We look through singles, slabs and sealed
            product and make you a fair offer, or work out a trade.
          </p>
          <p className="mt-3 font-display text-lg text-[#ffd02e]">{WANTED.join(" ★ ")}</p>
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
