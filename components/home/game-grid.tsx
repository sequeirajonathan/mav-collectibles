import Image from "next/image";
import Link from "next/link";
import { cn } from "@utils";

/** Logo tiles for the games people walk in asking for. Slugs match const/categories.ts. */
const GAMES = [
  { slug: "pokemon", name: "Pokémon", logo: "/games/pokemon.png" },
  { slug: "onepiece", name: "One Piece", logo: "/games/onepiece.jpg", cover: true },
  { slug: "magic", name: "Magic: The Gathering", logo: "/games/magic.png" },
  { slug: "dragonball", name: "Dragon Ball Super", logo: "/games/dragonball.png" },
  { slug: "yugioh", name: "Yu-Gi-Oh!", logo: "/games/yugioh.png" },
  { slug: "digimon", name: "Digimon", logo: "/games/digimon.png" },
  { slug: "gundam", name: "Gundam", logo: "/games/gundam.png" },
  { slug: "union", name: "Union Arena", logo: "/games/union.png" },
] as const;

export function GameGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 fold:grid-cols-4 fold:gap-4">
      {GAMES.map((g) => (
        <li key={g.slug}>
          <Link href={`/category/${g.slug}?group=TCG`} className="group block rounded-xl">
            <div className="sleeve holo relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={g.logo}
                alt=""
                fill
                sizes="(min-width: 576px) 25vw, 50vw"
                className={cn("cover" in g ? "object-cover" : "object-contain p-[12%]", "transition-transform duration-300 can-hover:group-hover:scale-105")}
              />
            </div>
            <span className="mt-2 block text-center text-sm font-bold text-foreground can-hover:group-hover:text-gold">{g.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
