import { ExternalLink, Star } from "lucide-react";
import { getFlags, getGoogleReviews } from "@lib/data/site";
import { SectionHeading } from "@components/ui/page-header";
import { cardVariants } from "@components/ui/card";
import { buttonVariants } from "@components/ui/button";
import { cn } from "@utils";

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5 text-gold", className)} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < Math.round(rating) ? "size-4 fill-current" : "size-4 opacity-30"} />
      ))}
    </span>
  );
}

const count = (total: number) => `${total.toLocaleString("en-US")} Google ${total === 1 ? "review" : "reviews"}`;

/**
 * One quiet line for the footer and other tight spots: the rating when we have
 * it, otherwise just a link to the reviews. Renders nothing when reviews are
 * switched off or the shop's Google listing isn't set.
 */
export async function GoogleRating({ className }: { className?: string }) {
  const [flags, summary] = await Promise.all([getFlags(), getGoogleReviews()]);
  if (!flags.showGoogleReviews || !summary.readUrl) return null;
  return (
    <a href={summary.readUrl} target="_blank" rel="noopener noreferrer" className={cn("inline-flex min-h-9 items-center gap-2 text-sm hover:text-gold", className)}>
      {summary.rating !== null && summary.total ? (
        <>
          <Stars rating={summary.rating} />
          <span>
            <strong>{summary.rating.toFixed(1)}</strong> · {count(summary.total)}
          </span>
        </>
      ) : (
        <>
          <Star aria-hidden className="size-4 fill-current text-gold" />
          <span>Read our Google reviews</span>
        </>
      )}
    </a>
  );
}

/** Rating, a few recent reviews, and links to read them all or leave one. */
export async function GoogleReviews({ heading = "What players say" }: { heading?: string }) {
  const [flags, summary] = await Promise.all([getFlags(), getGoogleReviews()]);
  if (!flags.showGoogleReviews || !summary.readUrl) return null;
  const reviews = summary.reviews.filter((r) => r.rating >= 4 && r.text.trim()).slice(0, 6);
  return (
    <section aria-labelledby="reviews-heading">
      <SectionHeading title={heading} />
      <h2 id="reviews-heading" className="sr-only">
        Google reviews
      </h2>
      <div className="flex flex-col gap-3 fold:flex-row fold:flex-wrap fold:items-center fold:justify-between">
        {summary.rating !== null && summary.total ? (
          <p className="flex items-center gap-2">
            <span className="text-3xl font-extrabold tabular-nums">{summary.rating.toFixed(1)}</span>
            <span>
              <Stars rating={summary.rating} className="block" />
              <span className="block text-sm text-muted-foreground">
                <span className="sr-only">{summary.rating.toFixed(1)} out of 5 stars from </span>
                {count(summary.total)}
              </span>
            </span>
          </p>
        ) : (
          <p className="max-w-prose text-foreground/80">Players and collectors review us on Google. Have a read, or tell us how we did.</p>
        )}
        <div className="flex flex-col gap-2 fold:flex-row">
          <a href={summary.readUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Read all reviews <ExternalLink aria-hidden />
          </a>
          {summary.writeUrl && (
            <a href={summary.writeUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Leave a review <ExternalLink aria-hidden />
            </a>
          )}
        </div>
      </div>
      {reviews.length > 0 && (
        <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none fold:mx-0 fold:grid fold:grid-cols-2 fold:overflow-visible fold:px-0 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.time} className={cn(cardVariants({ padding: "md" }), "w-[85%] shrink-0 snap-start fold:w-auto")}>
              <div aria-label={`${r.rating} out of 5 stars`}>
                <Stars rating={r.rating} />
              </div>
              <p className="mt-2 line-clamp-5 text-sm text-foreground/90">{r.text}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {r.author_name} · {r.relative_time_description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
