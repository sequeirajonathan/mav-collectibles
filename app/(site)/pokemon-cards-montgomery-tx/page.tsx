import type { Metadata } from "next";
import { InfoCard, LocalHero } from "@components/local/local-page";
import { VisitBlock } from "@components/local/visit-block";
import { LinkButton } from "@components/ui/link-button";
import { JsonLd } from "@components/seo/json-ld";
import { STORE, storeJsonLd } from "@lib/seo";

export const metadata: Metadata = {
  title: "Pokémon cards in Montgomery, TX",
  description:
    "Pokémon booster packs, Elite Trainer Boxes, singles and graded cards at MAV Collectibles in Montgomery, TX, near Conroe and Lake Conroe. League nights, pre-releases, and we buy and trade.",
};

export default function PokemonPage() {
  return (
    <div className="space-y-6">
      <JsonLd data={storeJsonLd()} />
      <LocalHero eyebrow="Montgomery, TX" title="Pokémon cards in" highlight="Montgomery, TX">
        MAV Collectibles is the local game store for Pokémon players and collectors around Lake Conroe. Come in to buy, sell,
        trade and play.
      </LocalHero>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="What's on the shelves">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Sealed product: booster packs, booster boxes, Elite Trainer Boxes and collection boxes, English and Japanese.</li>
            <li>Singles, from playable staples to chase cards.</li>
            <li>Graded cards: PSA, CGC, Beckett and TAG slabs.</li>
            <li>Supplies: sleeves, binders, deck boxes, top loaders and playmats.</li>
          </ul>
          <div className="flex flex-col gap-2 pt-1 fold:flex-row">
            <LinkButton href="/category/pokemon?group=TCG">Browse Pokémon</LinkButton>
            <LinkButton href="/category/pokemonsingles?group=TCG" variant="outline">
              Pokémon singles
            </LinkButton>
          </div>
        </InfoCard>

        <InfoCard title="Play Pokémon here">
          <p>
            We host Pokémon league nights, tournaments and pre-release events at the shop. New players are welcome; bring a deck
            or ask us to help you build one.
          </p>
          <p>RSVP online to save your seat, and track your season points on the leaderboard.</p>
          <div className="flex flex-col gap-2 pt-1 fold:flex-row">
            <LinkButton href="/events?game=pokemon">Pokémon events</LinkButton>
            <LinkButton href="/leaderboard" variant="outline">
              Leaderboard
            </LinkButton>
          </div>
        </InfoCard>

        <InfoCard title="Sell or trade your Pokémon cards">
          <p>
            Bring your binder, slabs or sealed product to the counter. We look through it with you and make a fair offer, or work
            out a trade toward something on the shelf.
          </p>
          <LinkButton href="/sell-your-cards" variant="outline">
            How selling works
          </LinkButton>
        </InfoCard>

        <InfoCard title="Where we are">
          <p>
            We&apos;re on Highway 105 West in Montgomery, a short drive from {STORE.areas.slice(1, -1).join(", ")} and{" "}
            {STORE.areas.at(-1)}.
          </p>
          <p>We also carry One Piece, Magic: The Gathering, Yu-Gi-Oh!, Dragon Ball Super, Digimon, Lorcana and more.</p>
          <LinkButton href="/shop" variant="outline">
            Browse every game
          </LinkButton>
        </InfoCard>
      </div>

      <VisitBlock />
    </div>
  );
}
