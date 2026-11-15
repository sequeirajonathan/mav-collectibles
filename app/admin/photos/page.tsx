import { Suspense } from "react";
import type { Route } from "next";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { ChipLink } from "@components/ui/chip";
import { LinkButton } from "@components/ui/link-button";
import { Skeleton } from "@components/ui/skeleton";
import { ApproveAll, PhotoReviewCard } from "@components/admin/photo-review";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { listImageReplacements } from "@lib/data/catalog-images";
import { replacementStatusSchema, type ReplacementStatus } from "@lib/contracts/catalog-images";

type SearchParams = Promise<{ status?: string; page?: string }>;

const LABELS: Record<ReplacementStatus, string> = { proposed: "To review", approved: "Approved", rejected: "Rejected" };
const href = (status: ReplacementStatus, page = 1) => `/admin/photos?status=${status}${page > 1 ? `&page=${page}` : ""}` as Route;

async function Review({ searchParams }: { searchParams: SearchParams }) {
  await requirePageRole(CONTENT_ROLES, "/admin/photos");
  const params = await searchParams;
  const status = replacementStatusSchema.catch("proposed").parse(params.status);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { rows, total, pageSize, counts } = await listImageReplacements(status, page);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {replacementStatusSchema.options.map((s) => (
          <ChipLink key={s} href={href(s)} active={s === status}>
            {LABELS[s]} ({counts[s]})
          </ChipLink>
        ))}
        {status === "proposed" && rows.length > 0 && (
          <div className="ml-auto">
            <ApproveAll itemIds={rows.map((r) => r.itemId)} />
          </div>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title={status === "proposed" ? "Nothing to review" : `No ${LABELS[status].toLowerCase()} photos`}
          description="New matches appear here after the nightly photo job runs."
        />
      ) : (
        <div className="grid gap-3 fold:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <PhotoReviewCard key={row.itemId} row={row} />
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <LinkButton href={href(status, page - 1)} variant="outline" size="sm">Previous</LinkButton>}
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          {page < pages && <LinkButton href={href(status, page + 1)} variant="outline" size="sm">Next</LinkButton>}
        </nav>
      )}
    </>
  );
}

export default function AdminPhotosPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Photos"
        description="Better photos for cards whose Square photo is missing or low quality, matched from TCGplayer. Customers only see a replacement after you approve it. Your Square photos are never changed."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Review searchParams={searchParams} />
      </Suspense>
    </>
  );
}
