import type { ReactNode } from "react";
import { Eyebrow } from "@components/ui/page-header";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

/** Splash header shared by the local landing pages. */
export function LocalHero({ eyebrow, title, highlight, children }: { eyebrow: string; title: string; highlight: string; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-hero px-5 py-8 fold:px-8 fold:py-10">
      <div aria-hidden className="speed-lines pointer-events-none absolute inset-0" />
      <div className="relative max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="ui-hero-title font-display mt-3 text-[2.5rem] leading-[1.08] fold:text-6xl">
          {title} <span className="text-pop">{highlight}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-foreground/80 fold:text-lg">{children}</p>
      </div>
    </section>
  );
}

export function InfoCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn(cardVariants({ padding: "lg" }), className)}>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-2 space-y-3 text-foreground/85">{children}</div>
    </section>
  );
}
