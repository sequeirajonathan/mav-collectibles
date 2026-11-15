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
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SquareClient, SquareEnvironment } from "square";
import { z } from "zod";
import { processImage } from "./process-image";
import { PRODUCT_IMAGE_BUCKET, PROCESSOR_VERSION } from "../../lib/catalog/product-image-config";

interface Source {
  id: string;
  url: string;
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
  const sources: Source[] = [];
  for await (const object of await square.catalog.list({ types: "IMAGE" })) {
    if (object.type === "IMAGE" && object.id && !object.isDeleted && object.imageData?.url) {
      sources.push({ id: object.id, url: object.imageData.url });
    }
  }
  return sources;
}

const exportSchema = z.object({
  images: z.record(z.string(), z.string()),
  objects: z.array(z.looseObject({ id: z.string(), type: z.string(), imageData: z.looseObject({ url: z.string().nullish() }).nullish() })),
});

async function fromExport(): Promise<Source[]> {
  const dir = path.join(process.cwd(), "square-export");
  const data = exportSchema.parse(JSON.parse(await readFile(path.join(dir, "catalog.json"), "utf8")));
  return data.objects.flatMap((o) => {
    const file = data.images[o.id];
    const url = o.imageData?.url;
    return o.type === "IMAGE" && file && url ? [{ id: o.id, url, file: path.join(dir, "images", file) }] : [];
  });
}

const rowSchema = z.object({ square_image_id: z.string(), source_url: z.string(), processor_version: z.number(), path: z.string() });
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
      .select("square_image_id, source_url, processor_version, path")
      .order("square_image_id")
      .range(from, from + 999);
    if (error) throw new Error(`Couldn't read product_images: ${error.message}`);
    for (const row of z.array(rowSchema).parse(data)) existing.set(row.square_image_id, row);
    if (data.length < 1000) break;
  }

  const todo = sources.filter((s) => {
    const row = existing.get(s.id);
    return !row || row.source_url !== s.url || row.processor_version < PROCESSOR_VERSION;
  });
  const batch = todo.slice(0, limit);
  console.log(`${existing.size} already processed, ${todo.length} to do${batch.length < todo.length ? ` (${batch.length} this run)` : ""}.`);

  const counts = { cutout: 0, photo: 0, failed: 0 };
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
      const image = await processImage(bytes);
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
    const stale = [...existing.values()].filter((row) => !live.has(row.square_image_id));
    for (let i = 0; i < stale.length; i += 100) {
      const chunk = stale.slice(i, i + 100);
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(chunk.map((r) => r.path));
      await supabase.from("product_images").delete().in("square_image_id", chunk.map((r) => r.square_image_id));
    }
    if (stale.length) console.log(`Removed ${stale.length} photos that are no longer on Square.`);
  }

  console.log(`Done: ${counts.cutout} cut out, ${counts.photo} trimmed, ${counts.failed} failed.`);
  // A few bad photos shouldn't fail the nightly job; a broken run should.
  if (batch.length > 0 && counts.failed > batch.length / 2) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
