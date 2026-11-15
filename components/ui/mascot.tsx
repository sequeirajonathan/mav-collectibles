"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { cn } from "@utils";

/**
 * Pixel-art sprites used as mascots. The Pokémon here are the ones that show
 * up most in the shop's own catalog.
 */
const MASCOTS = {
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

type MascotName = keyof typeof MASCOTS;
/** A specific character, or "random" for a different one on each visit. */
export type MascotChoice = MascotName | "random";

/** Everyone except Magikarp, who is saved for the 404 page. */
const POOL = (Object.keys(MASCOTS) as MascotName[]).filter((name) => name !== "karp");

const subscribe = () => () => {};

/**
 * A bobbing pixel sprite in a fixed square, so every character takes up the
 * same space whatever its artwork's size. Give the square a size with
 * `className` (e.g. "size-24"). Decorative: hidden from screen readers.
 *
 * "random" picks in the browser, after the page loads, so the server and the
 * browser never disagree about who is shown; the square holds the space until then.
 */
export function Mascot({ name, className }: { name: MascotChoice; className?: string }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [picked] = useState<MascotName>(() => (typeof window === "undefined" ? POOL[0] : POOL[Math.floor(Math.random() * POOL.length)]));
  const shown = name === "random" ? (mounted ? picked : null) : name;
  return (
    <span aria-hidden className={cn("relative block shrink-0", className)}>
      {shown && <Image {...MASCOTS[shown]} alt="" unoptimized className="pixelated animate-bob absolute inset-0 size-full object-contain object-bottom" />}
    </span>
  );
}
