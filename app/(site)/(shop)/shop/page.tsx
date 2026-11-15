import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_GROUPS } from "@const/categories";
import { PageHeader } from "@components/ui/page-header";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

export const metadata: Metadata = { title: "Shop", description: "Browse Pokémon and TCG products on our shelves at MAV Collectibles." };

const GROUP_PARAM: Record<string, string> = { TCG: "TCG", Collectibles: "COLLECTIBLES", "Supplies & Grading": "SUPPLIES" };

export default function ShopPage() {
  return (
    <>
      <PageHeader eyebrow="Shop" title="Browse the shelves" description="Sealed product, singles, collectibles and supplies." />
      <div className="space-y-8">
        {CATEGORY_GROUPS.map((group) => (
          <section key={group.name} aria-labelledby={`group-${group.name}`}>
            <h2 id={`group-${group.name}`} className="mb-3 text-lg font-bold">{group.name}</h2>
            <ul className="grid grid-cols-2 gap-2 fold:grid-cols-3 lg:grid-cols-4">
              {group.categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}?group=${GROUP_PARAM[group.name] ?? "TCG"}`}
                    className={cn(cardVariants({ variant: "interactive", padding: "row" }), "flex min-h-14 items-center text-sm font-semibold")}
                  >
                    {c.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
