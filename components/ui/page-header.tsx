import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@utils";

/** The <h1> block at the top of every page, with optional eyebrow and actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 fold:mb-8 fold:flex-row fold:items-end fold:justify-between">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground fold:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground fold:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Small gold all-caps label above a heading. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs font-bold uppercase tracking-[0.2em] text-gold", className)}>{children}</p>;
}

/** <h2> for a section, with an optional "See all →" link on the right. */
export function SectionHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="flex items-center gap-2.5 text-lg font-bold text-foreground fold:text-xl">
        <span aria-hidden className="h-5 w-1 rounded-full bg-gradient-to-b from-gold-light to-gold-dark" />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-gold hover:text-gold-light"
        >
          {linkLabel ?? "See all"}
          <ArrowRight aria-hidden className="size-4 transition-transform can-hover:group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** "Nothing here yet" placeholder with an optional action. */
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-panel/60 px-6 py-10 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
