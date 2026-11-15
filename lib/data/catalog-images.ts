import "server-only";
import { prisma } from "@lib/prisma";
import { publicEnv } from "@lib/env";
import { PRODUCT_IMAGE_BUCKET } from "@lib/catalog/product-image-config";
import { imageReplacementSchema, type ImageReplacement, type ReplacementStatus } from "@lib/contracts/catalog-images";

const PAGE_SIZE = 24;
const publicUrl = (path: string) => `${publicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;

/** Replacement photos for staff review (not cached: staff need the live list). */
export async function listImageReplacements(status: ReplacementStatus, page: number): Promise<{ rows: ImageReplacement[]; total: number; pageSize: number; counts: Record<ReplacementStatus, number> }> {
  const [rows, grouped] = await Promise.all([
    prisma.imageReplacement.findMany({ where: { status }, orderBy: [{ created_at: "asc" }, { square_item_id: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.imageReplacement.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const imageIds = rows.flatMap((r) => (r.square_image_id ? [r.square_image_id] : []));
  const current = new Map(
    (imageIds.length ? await prisma.productImage.findMany({ where: { square_image_id: { in: imageIds } } }) : []).map((i) => [i.square_image_id, i])
  );
  const counts: Record<ReplacementStatus, number> = { proposed: 0, approved: 0, rejected: 0 };
  for (const g of grouped) if (g.status in counts) counts[g.status as ReplacementStatus] = g._count._all;

  return {
    total: counts[status],
    pageSize: PAGE_SIZE,
    counts,
    rows: rows.map((r) => {
      const now = r.square_image_id ? current.get(r.square_image_id) : undefined;
      return imageReplacementSchema.parse({
        itemId: r.square_item_id,
        itemName: r.item_name,
        sourceName: r.source_name,
        sourceSet: r.source_set,
        status: r.status,
        currentUrl: now ? publicUrl(now.path) : null,
        currentSize: now ? `${now.width}×${now.height}` : null,
        proposedUrl: publicUrl(r.path),
        proposedSize: `${r.width}×${r.height}`,
        createdAt: r.created_at.toISOString(),
      });
    }),
  };
}
