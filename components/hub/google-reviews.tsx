import { Star } from "lucide-react";
import { getGoogleReviews } from "@lib/data/site";
import { SectionHeading } from "@components/ui/page-header";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

export async function GoogleReviews() {
  const reviews = (await getGoogleReviews()).filter((r) => r.rating >= 4 && r.text.trim()).slice(0, 6);
  if (reviews.length === 0) return null;
  return (
    <section aria-labelledby="reviews-heading">
      <SectionHeading title="What players say" />
      <h2 id="reviews-heading" className="sr-only">Google reviews</h2>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none fold:mx-0 fold:grid fold:grid-cols-2 fold:overflow-visible fold:px-0 lg:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.time} className={cn(cardVariants({ padding: "md" }), "w-[85%] shrink-0 snap-start fold:w-auto")}>
            <div className="flex gap-0.5 text-gold" aria-label={`${r.rating} out of 5 stars`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={i < r.rating ? "size-4 fill-current" : "size-4 opacity-30"} />
              ))}
            </div>
            <p className="mt-2 line-clamp-5 text-sm text-foreground/90">{r.text}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {r.author_name} · {r.relative_time_description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
