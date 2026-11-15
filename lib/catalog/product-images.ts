import "server-only";
import type { Square } from "square";
import { prisma } from "@lib/prisma";
import { publicEnv } from "@lib/env";
import { PRODUCT_IMAGE_BUCKET } from "./product-image-config";

const publicUrl = (path: string) =>
  `${publicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;

/**
 * Swaps Square photo URLs for our cleaned copies where one exists
 * (scripts/images/sync.ts makes them). Photos that haven't been processed yet,
 * or a failed lookup, keep the Square original, so images never break.
 */
export async function withProcessedImages<T extends Square.CatalogObject>(objects: T[] | undefined): Promise<T[]> {
  if (!objects?.length) return objects ?? [];
  const ids = objects.flatMap((o) => (o.type === "IMAGE" && o.id ? [o.id] : []));
  if (!ids.length) return objects;

  let rows: { square_image_id: string; path: string; source_url: string }[];
  try {
    rows = await prisma.productImage.findMany({
      where: { square_image_id: { in: ids } },
      select: { square_image_id: true, path: true, source_url: true },
    });
  } catch (error) {
    console.error("Processed image lookup failed; using Square originals", error);
    return objects;
  }
  const processed = new Map(rows.map((r) => [r.square_image_id, r]));

  return objects.map((object) => {
    if (object.type !== "IMAGE" || !object.imageData) return object;
    const row = processed.get(object.id);
    // A different source URL means staff replaced the photo; show the new
    // original until the next sync processes it.
    if (!row || row.source_url !== object.imageData.url) return object;
    return { ...object, imageData: { ...object.imageData, url: publicUrl(row.path) } };
  });
}
