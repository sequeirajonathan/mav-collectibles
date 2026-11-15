import type { Metadata } from "next";
import { InfoCard, LocalHero } from "@components/local/local-page";
import { VisitBlock } from "@components/local/visit-block";
import { JsonLd } from "@components/seo/json-ld";
import { storeJsonLd } from "@lib/seo";

export const metadata: Metadata = {
  title: "Sell your Pokémon cards in Montgomery, TX",
  description:
    "Sell or trade Pokémon cards, graded slabs, sealed product and whole collections at MAV Collectibles in Montgomery, TX. Bring them to the counter for a fair offer.",
};

const STEPS = [
  { title: "Bring them in", text: "Come by during opening hours with your cards. No appointment needed; for a large collection, a quick call first helps us set time aside." },
  { title: "We look through them with you", text: "We check what you have, its condition and what it's selling for right now." },
  { title: "Get an offer", text: "We make you a fair offer. Take it, or put the value toward something in the shop as a trade." },
];

const WANTED = [
  "Pokémon, One Piece, Magic: The Gathering, Yu-Gi-Oh!, Dragon Ball Super and other trading card games",
  "Raw singles, from modern hits to vintage",
  "Graded cards: PSA, CGC, Beckett and TAG",
  "Sealed product: booster boxes, Elite Trainer Boxes, collection boxes",
  "Whole collections and bulk",
];

export default function SellPage() {
  return (
    <div className="space-y-6">
      <JsonLd data={storeJsonLd()} />
      <LocalHero eyebrow="Buy · Sell · Trade" title="Sell your cards at" highlight="MAV Collectibles">
        Cleaning out a binder or selling a whole collection? Bring it to the counter in Montgomery, TX. We buy and trade
        Pokémon and other trading cards.
      </LocalHero>

      <section aria-labelledby="how" className="space-y-3">
        <h2 id="how" className="font-display text-2xl">How it works</h2>
        <ol className="grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <InfoCard title={`${i + 1}. ${step.title}`} className="h-full">
                <p>{step.text}</p>
              </InfoCard>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="What we buy">
          <ul className="list-disc space-y-1.5 pl-5">
            {WANTED.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="Before you come">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Keep valuable cards in sleeves or top loaders so they arrive in the condition they left.</li>
            <li>Sorting by game and set makes the look-through faster.</li>
            <li>Offers depend on the card, its condition and the current market, so we can&apos;t quote a price until we see it.</li>
          </ul>
        </InfoCard>
      </div>

      <VisitBlock heading="Bring them by" />
    </div>
  );
}
