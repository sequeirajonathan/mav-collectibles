import Image from "next/image";
import { cn } from "@utils";

/**
 * Pixel-art sprites used as mascots. The Pokémon here are the ones that show
 * up most in the shop's own catalog, so each empty or waiting screen can have
 * its own character instead of repeating one.
 */
export const MASCOTS = {
  lucario: { src: "/images/lucario.gif", width: 47, height: 63 },
  gengar: { src: "/images/gengar.gif", width: 500, height: 493 },
  karp: { src: "/images/karp.gif", width: 500, height: 659 },
  charizard: { src: "/images/mascots/charizard.gif", width: 87, height: 89 },
  pikachu: { src: "/images/mascots/pikachu.gif", width: 50, height: 46 },
  mew: { src: "/images/mascots/mew.gif", width: 77, height: 53 },
  mewtwo: { src: "/images/mascots/mewtwo.gif", width: 90, height: 69 },
  eevee: { src: "/images/mascots/eevee.gif", width: 46, height: 47 },
  umbreon: { src: "/images/mascots/umbreon.gif", width: 43, height: 51 },
  snorlax: { src: "/images/mascots/snorlax.gif", width: 74, height: 75 },
  dragonite: { src: "/images/mascots/dragonite.gif", width: 80, height: 82 },
  gyarados: { src: "/images/mascots/gyarados.gif", width: 102, height: 84 },
  rayquaza: { src: "/images/mascots/rayquaza.gif", width: 110, height: 98 },
  gardevoir: { src: "/images/mascots/gardevoir.gif", width: 71, height: 77 },
  charmander: { src: "/images/mascots/charmander.gif", width: 41, height: 42 },
  blastoise: { src: "/images/mascots/blastoise.gif", width: 70, height: 66 },
  sylveon: { src: "/images/mascots/sylveon.gif", width: 51, height: 62 },
} as const;

export type MascotName = keyof typeof MASCOTS;

/** A bobbing pixel sprite. Decorative: hidden from screen readers. Size it with a height class. */
export function Mascot({ name, className }: { name: MascotName; className?: string }) {
  return <Image {...MASCOTS[name]} alt="" unoptimized className={cn("pixelated animate-bob w-auto", className)} />;
}
