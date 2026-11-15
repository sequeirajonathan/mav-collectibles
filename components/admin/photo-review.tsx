"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Check, Undo2, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { ProductTile } from "@components/shop/product-tile";
import { reviewImageReplacements } from "@lib/actions/catalog-images";
import type { ImageReplacement } from "@lib/contracts/catalog-images";
import { cn } from "@utils";

type Decision = "approved" | "rejected" | "proposed";
const DONE: Record<Decision, string> = { approved: "Approved", rejected: "Rejected", proposed: "Moved back to review" };

function useReview() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const review = (itemIds: string[], decision: Decision) =>
    startTransition(async () => {
      const result = await reviewImageReplacements({ itemIds, decision });
      if (!result.ok) return void toast.error(result.error);
      toast.success(itemIds.length > 1 ? `${DONE[decision]} ${result.data.updated} photos` : DONE[decision]);
      router.refresh();
    });
  return { pending, review };
}

export function ApproveAll({ itemIds }: { itemIds: string[] }) {
  const { pending, review } = useReview();
  return (
    <Button variant="outline" disabled={pending || itemIds.length === 0} onClick={() => review(itemIds, "approved")}>
      <Check aria-hidden /> Approve all {itemIds.length} on this page
    </Button>
  );
}

export function PhotoReviewCard({ row }: { row: ImageReplacement }) {
  const { pending, review } = useReview();
  return (
    <article className={cn(cardVariants(), "flex flex-col gap-3 p-3")} aria-label={row.itemName}>
      <div className="grid grid-cols-2 gap-2">
        <figure>
          <ProductTile src={row.currentUrl ?? undefined} alt="Current photo" sizes="200px" className="aspect-[4/5] rounded-lg" />
          <figcaption className="mt-1 text-xs text-muted-foreground">Now{row.currentSize ? ` · ${row.currentSize}` : " · no photo"}</figcaption>
        </figure>
        <figure>
          <ProductTile src={row.proposedUrl} alt="Proposed photo" sizes="200px" className="aspect-[4/5] rounded-lg ring-1 ring-gold/50" />
          <figcaption className="mt-1 text-xs text-gold">Proposed · {row.proposedSize}</figcaption>
        </figure>
      </div>
      <div className="min-w-0 text-sm">
        <p className="font-semibold leading-snug">{row.itemName}</p>
        <p className="mt-1 text-muted-foreground">
          Matched: <span className="text-foreground">{row.sourceName}</span>
          {row.sourceSet ? ` · ${row.sourceSet}` : ""}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {row.status === "proposed" ? (
          <>
            <Button size="sm" variant="gold" disabled={pending} onClick={() => review([row.itemId], "approved")}>
              <Check aria-hidden /> Approve
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => review([row.itemId], "rejected")}>
              <X aria-hidden /> Reject
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => review([row.itemId], "proposed")}>
            <Undo2 aria-hidden /> Undo
          </Button>
        )}
      </div>
    </article>
  );
}
