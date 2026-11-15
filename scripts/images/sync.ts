/**
 * Keeps cleaned copies of the shop's Square product photos in Supabase Storage.
 *
 *   npx tsx scripts/images/sync.ts                 # process new or changed photos
 *   npx tsx scripts/images/sync.ts --limit 200     # at most 200 this run
 *   npx tsx scripts/images/sync.ts --from-export   # read square-export/ instead of calling Square
 *
 * Square is only read (catalog list + image download). Runs nightly from
 * .github/workflows/product-images.yml; safe to stop and re-run at any time.
 *
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and SQUARE_ACCESS_TOKEN
 * (unless --from-export).
 *
 * Paid background removal is OFF by default. To turn it on set
 * IMAGE_BG_PROVIDER=photoroom and PHOTOROOM_API_KEY; IMAGE_PAID_LIMIT caps the
 * paid photos per run (default 200). Card scans and graded slabs are never sent.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SquareClient, SquareEnvironment } from "square";
import { z } from "zod";
import { processImage } from "./process-image";
import { PRODUCT_IMAGE_BUCKET, PROCESSOR_VERSION } from "../../lib/catalog/product-image-config";

/** Categories whose photos are card scans or slabs: trimmed and rounded, never cut out. */
const CARD_CATEGORY = /singles|graded|slab|\bPSA\b|\bCGC\b|\bBGS\b|tcg ?player/i;

interface Source {
  id: string;
  url: string;
  /** True when every item using this photo is a card scan or slab. */
  card: boolean;
  /** Local file to read instead of downloading (export mode). */
  file?: string;
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

async function fromSquare(): Promise<Source[]> {
  const square = new SquareClient({
    environment: process.env.SQUARE_ENVIRONMENT === "sandbox" ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    token: required("SQUARE_ACCESS_TOKEN"),
  });
  const urls = new Map<string, string>();
  const categories = new Map<string, string>();
  const usedBy = new Map<string, string[]>();
  for await (const object of await square.catalog.list({ types: "IMAGE,ITEM,CATEGORY" })) {
    if (!object.id || object.isDeleted) continue;
    if (object.type === "IMAGE" && object.imageData?.url) urls.set(object.id, object.imageData.url);
    if (object.type === "CATEGORY" && object.categoryData?.name) categories.set(object.id, object.categoryData.name);
    if (object.type === "ITEM") {
      const category = object.itemData?.categories?.[0]?.id ?? object.itemData?.reportingCategory?.id ?? "";
      for (const imageId of object.itemData?.imageIds ?? []) usedBy.set(imageId, [...(usedBy.get(imageId) ?? []), category]);
    }
  }
  return [...urls].map(([id, url]) => ({ id, url, card: isCard(usedBy.get(id), categories) }));
}

function isCard(categoryIds: string[] | undefined, categories: Map<string, string>): boolean {
  return Boolean(categoryIds?.length) && (categoryIds ?? []).every((id) => CARD_CATEGORY.test(categories.get(id) ?? ""));
}

const exportSchema = z.object({
  images: z.record(z.string(), z.string()),
  objects: z.array(
    z.looseObject({
      id: z.string(),
      type: z.string(),
      imageData: z.looseObject({ url: z.string().nullish() }).nullish(),
      categoryData: z.looseObject({ name: z.string().nullish() }).nullish(),
      itemData: z
        .looseObject({
          imageIds: z.array(z.string()).nullish(),
          categories: z.array(z.looseObject({ id: z.string().nullish() })).nullish(),
          reportingCategory: z.looseObject({ id: z.string().nullish() }).nullish(),
        })
        .nullish(),
    })
  ),
});

async function fromExport(): Promise<Source[]> {
  const dir = path.join(process.cwd(), "square-export");
  const data = exportSchema.parse(JSON.parse(await readFile(path.join(dir, "catalog.json"), "utf8")));
  const categories = new Map<string, string>();
  const usedBy = new Map<string, string[]>();
  for (const o of data.objects) {
    if (o.type === "CATEGORY" && o.categoryData?.name) categories.set(o.id, o.categoryData.name);
    if (o.type === "ITEM") {
      const category = o.itemData?.categories?.[0]?.id ?? o.itemData?.reportingCategory?.id ?? "";
      for (const imageId of o.itemData?.imageIds ?? []) usedBy.set(imageId, [...(usedBy.get(imageId) ?? []), category]);
    }
  }
  return data.objects.flatMap((o) => {
    const file = data.images[o.id];
    const url = o.imageData?.url;
    return o.type === "IMAGE" && file && url
      ? [{ id: o.id, url, card: isCard(usedBy.get(o.id), categories), file: path.join(dir, "images", file) }]
      : [];
  });
}

const rowSchema = z.object({
  square_image_id: z.string(),
  source_url: z.string(),
  processor_version: z.number(),
  path: z.string(),
  background_provider: z.string(),
});
type Row = z.infer<typeof rowSchema>;

async function main() {
  const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const limit = Number(option("limit") ?? Infinity);

  const sources = flag("from-export") ? await fromExport() : await fromSquare();
  console.log(`Square has ${sources.length} product photos.`);

  const existing = new Map<string, Row>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("product_images")
      .select("square_image_id, source_url, processor_version, path, background_provider")
      .order("square_image_id")
      .range(from, from + 999);
    if (error) throw new Error(`Couldn't read product_images: ${error.message}`);
    for (const row of z.array(rowSchema).parse(data)) existing.set(row.square_image_id, row);
    if (data.length < 1000) break;
  }

  // Paid background removal: off unless both settings are present.
  const paidOn = process.env.IMAGE_BG_PROVIDER === "photoroom" && Boolean(process.env.PHOTOROOM_API_KEY);
  let paidLeft = paidOn ? Number(process.env.IMAGE_PAID_LIMIT || 200) : 0;
  if (process.env.IMAGE_BG_PROVIDER === "photoroom" && !paidOn) console.warn("IMAGE_BG_PROVIDER=photoroom but PHOTOROOM_API_KEY is missing; using the free model.");

  const stale = (s: Source) => {
    const row = existing.get(s.id);
    return !row || row.source_url !== s.url || row.processor_version < PROCESSOR_VERSION;
  };
  // With the paid provider on, product photos done by the free model get redone (up to the limit).
  const upgrade = (s: Source) => paidOn && !s.card && existing.get(s.id)?.background_provider !== "photoroom";
  const todo = sources.filter((s) => stale(s) || upgrade(s));
  const batch = todo.slice(0, limit);
  console.log(`${existing.size} already processed, ${todo.length} to do${batch.length < todo.length ? ` (${batch.length} this run)` : ""}.`);

  const counts = { cutout: 0, photo: 0, failed: 0 };
  const paidBudget = paidLeft;
  let done = 0;
  for (const source of batch) {
    try {
      let bytes: Buffer;
      if (source.file) {
        bytes = await readFile(source.file);
      } else {
        const response = await fetch(source.url);
        if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`);
        bytes = Buffer.from(await response.arrayBuffer());
      }
      const paid = paidOn && !source.card && paidLeft > 0;
      // Out of paid budget: leave an already-processed photo for a later run.
      if (!paid && !stale(source)) continue;
      const image = await processImage(bytes, { card: source.card, paid });
      if (paid) paidLeft--;
      const objectPath = `v${PROCESSOR_VERSION}/${source.id}.webp`;
      const upload = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(objectPath, image.data, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
      if (upload.error) throw new Error(`upload failed: ${upload.error.message}`);
      const saved = await supabase.from("product_images").upsert({
        square_image_id: source.id,
        path: objectPath,
        kind: image.kind,
        width: image.width,
        height: image.height,
        source_url: source.url,
        background_provider: image.provider,
        processor_version: PROCESSOR_VERSION,
        processed_at: new Date().toISOString(),
      });
      if (saved.error) throw new Error(`save failed: ${saved.error.message}`);

      // Remove the previous version's file once the new one is live.
      const previous = existing.get(source.id);
      if (previous && previous.path !== objectPath) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([previous.path]);
      counts[image.kind]++;
    } catch (error) {
      counts.failed++;
      console.warn(`  ${source.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (++done % 100 === 0) console.log(`  ${done}/${batch.length}`);
  }

  // Photos deleted from Square: drop our copies (only when we saw the full list).
  if (!flag("from-export")) {
    const live = new Set(sources.map((s) => s.id));
    const gone = [...existing.values()].filter((row) => !live.has(row.square_image_id));
    for (let i = 0; i < gone.length; i += 100) {
      const chunk = gone.slice(i, i + 100);
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(chunk.map((r) => r.path));
      await supabase.from("product_images").delete().in("square_image_id", chunk.map((r) => r.square_image_id));
    }
    if (gone.length) console.log(`Removed ${gone.length} photos that are no longer on Square.`);
  }

  console.log(`Done: ${counts.cutout} cut out, ${counts.photo} trimmed, ${counts.failed} failed.`);
  if (paidOn) console.log(`Paid background removals this run: ${paidBudget - paidLeft} of ${paidBudget} allowed.`);
  // A few bad photos shouldn't fail the nightly job; a broken run should.
  if (batch.length > 0 && counts.failed > batch.length / 2) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
