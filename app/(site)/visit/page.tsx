import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleReviews } from "@components/hub/google-reviews";
import { InfoCard, LocalHero } from "@components/local/local-page";
import { VisitBlock } from "@components/local/visit-block";
import { LinkButton } from "@components/ui/link-button";
import { ShopOnly } from "@components/layout/shop-only";
import { JsonLd } from "@components/seo/json-ld";
import { STORE, storeJsonLd } from "@lib/seo";

export const metadata: Metadata = {
  title: "Hours and directions in Montgomery, TX",
  description:
    "MAV Collectibles is at 19786 Hwy 105 W Ste 190, Montgomery, TX 77356. Opening hours, phone and directions for the local Pokémon and trading card game store near Lake Conroe.",
};

export default function VisitPage() {
  return (
    <div className="space-y-6">
      <JsonLd data={storeJsonLd()} />
      <LocalHero eyebrow="Hours and directions" title="Come see us in" highlight="Montgomery, TX">
        A card shop and play space on Highway 105 West, near Lake Conroe. Browse the shelves, play in an event, or bring cards
        to sell and trade.
      </LocalHero>

      <VisitBlock heading="Find us" />

      <Suspense fallback={null}>
        <GoogleReviews heading="What visitors say" />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Coming from nearby">
          <p>
            Players and collectors come in from {STORE.areas.slice(0, -1).join(", ")} and {STORE.areas.at(-1)}. Tap
            &ldquo;Get directions&rdquo; above for a route from where you are.
          </p>
        </InfoCard>
        <InfoCard title="What to do when you're here">
          <div className="flex flex-col gap-2 fold:flex-row fold:flex-wrap">
            <LinkButton href="/events">See events</LinkButton>
            <ShopOnly>
              <LinkButton href="/shop" variant="outline">
                Browse the shop
              </LinkButton>
            </ShopOnly>
            <LinkButton href="/sell-your-cards" variant="outline">
              Sell your cards
            </LinkButton>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
