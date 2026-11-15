/**
 * Clone the shop's Square catalog into a Square sandbox and into test fixtures.
 *
 *   npx tsx scripts/square/clone-catalog.ts export    # production → square-export/ (read-only)
 *   npx tsx scripts/square/clone-catalog.ts import    # square-export/ → sandbox
 *   npx tsx scripts/square/clone-catalog.ts fixtures  # square-export/ → tests/fixtures/catalog.json
 *
 * Tokens: SQUARE_PRODUCTION_TOKEN (export) and SQUARE_SANDBOX_TOKEN (import).
 * In a Claude cloud session the network proxy injects them, so they can be unset.
 *
 * `export` only calls list/read endpoints on production. Nothing is written to
 * the production account. `import` refuses to run against anything but the sandbox.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { SquareClient, SquareEnvironment, type Square } from "square";
import { z } from "zod";
import { CATEGORY_MAPPING, COLLECTIBLES_MAPPING, SUPPLIES_MAPPING } from "../../const/categories";
import { catalogItemSchema, productSchema, type CatalogItem, type Product } from "../../lib/contracts/catalog";
import { processImage } from "../images/process-image";

const ROOT = process.cwd();
const EXPORT_DIR = path.join(ROOT, "square-export");
const EXPORT_FILE = path.join(EXPORT_DIR, "catalog.json");
const IMAGE_DIR = path.join(EXPORT_DIR, "images");
const MAP_FILE = path.join(ROOT, "const/square-sandbox-map.json");
const FIXTURE_FILE = path.join(ROOT, "tests/fixtures/catalog.json");
const FIXTURE_IMAGE_DIR = path.join(ROOT, "public/fixtures/catalog");

const EXPORT_TYPES = ["CATEGORY", "TAX", "ITEM_OPTION", "MODIFIER_LIST", "ITEM", "IMAGE"] as const;
/** Types created before items, so items can point at their real sandbox IDs. */
const SUPPORT_TYPES = new Set<string>(["CATEGORY", "TAX", "ITEM_OPTION", "MODIFIER_LIST"]);

// ---------------------------------------------------------------------------
// Serialization: the SDK uses bigint for money and versions.
// ---------------------------------------------------------------------------

const BIGINT_TAG = "$bigint";

function stringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => (typeof v === "bigint" ? { [BIGINT_TAG]: v.toString() } : v), 2);
}

function reviveBigInts(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reviveBigInts);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const tagged = record[BIGINT_TAG];
    if (typeof tagged === "string" && Object.keys(record).length === 1) return BigInt(tagged);
    return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, reviveBigInts(v)]));
  }
  return value;
}

type CatalogObject = Square.CatalogObject & { id: string };
const hasId = (o: Square.CatalogObject): o is CatalogObject => typeof o.id === "string" && o.id.length > 0;

const exportSchema = z.object({
  exportedAt: z.string(),
  locationId: z.string(),
  objects: z.array(z.custom<CatalogObject>((v) => typeof v === "object" && v !== null && "type" in v && "id" in v && typeof v.id === "string")),
  /** Variation ID → in-stock quantity at the shop location. */
  stock: z.record(z.string(), z.number()),
  /** Image ID → file name in square-export/images. */
  images: z.record(z.string(), z.string()),
});
type CatalogExport = z.infer<typeof exportSchema>;

async function loadExport(): Promise<CatalogExport> {
  const raw: unknown = JSON.parse(await readFile(EXPORT_FILE, "utf8"));
  return exportSchema.parse(reviveBigInts(raw));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function client(environment: "production" | "sandbox"): SquareClient {
  const token =
    (environment === "production" ? process.env.SQUARE_PRODUCTION_TOKEN : process.env.SQUARE_SANDBOX_TOKEN) ??
    // Placeholder replaced by the Claude cloud network proxy; real runs set the variables above.
    "injected-by-proxy";
  return new SquareClient({
    environment: environment === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    token,
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const wait = 500 * 2 ** i;
      console.warn(`  ${label} failed (attempt ${i + 1}/${attempts}), retrying in ${wait} ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastError;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    })
  );
  return results;
}

function variationsOf(item: Square.CatalogObject): (Square.CatalogObject & { id: string })[] {
  const variations = item.type === "ITEM" ? (item.itemData?.variations ?? []) : [];
  return variations.filter((v): v is Square.CatalogObject & { id: string } => typeof v.id === "string");
}

// ---------------------------------------------------------------------------
// export: production → square-export/ (read-only)
// ---------------------------------------------------------------------------

async function runExport(): Promise<void> {
  const square = client("production");

  const { locations = [] } = await square.locations.list();
  const active = locations.filter((l) => l.status === "ACTIVE");
  const location = active.find((l) => l.type === "PHYSICAL") ?? active[0];
  if (!location?.id) throw new Error("No active Square location found.");
  console.log(`Location: ${location.name ?? location.id}`);

  const objects: CatalogObject[] = [];
  const pages = await square.catalog.list({ types: EXPORT_TYPES.join(",") });
  for await (const object of pages) {
    if (!object.isDeleted && hasId(object)) objects.push(object);
  }
  const counts = new Map<string, number>();
  for (const o of objects) counts.set(o.type, (counts.get(o.type) ?? 0) + 1);
  console.log(`Catalog: ${[...counts].map(([t, n]) => `${n} ${t}`).join(", ")}`);

  const variationIds = objects.flatMap(variationsOf).flatMap((v) => (v.id ? [v.id] : []));
  const stock: Record<string, number> = {};
  for (const ids of chunk(variationIds, 500)) {
    const page = await withRetry("inventory", () =>
      square.inventory.batchGetCounts({ catalogObjectIds: ids, locationIds: [location.id ?? ""], states: ["IN_STOCK"] })
    );
    for await (const count of page) {
      if (count.catalogObjectId) {
        stock[count.catalogObjectId] = (stock[count.catalogObjectId] ?? 0) + Number(count.quantity ?? 0);
      }
    }
  }
  console.log(`Inventory: ${Object.keys(stock).length} variations with stock`);

  await mkdir(IMAGE_DIR, { recursive: true });
  const imageObjects = objects.filter((o) => o.type === "IMAGE");
  const images: Record<string, string> = {};
  await mapLimit(imageObjects, 6, async (image) => {
    const url = image.type === "IMAGE" ? image.imageData?.url : undefined;
    if (!url) return;
    try {
      const response = await withRetry("image", () => fetch(url));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // Square accepts JPEG, PNG and GIF uploads; normalise everything to JPEG.
      const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
        .rotate()
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 88 })
        .toBuffer();
      const file = `${image.id}.jpg`;
      await writeFile(path.join(IMAGE_DIR, file), jpeg);
      images[image.id] = file;
    } catch (error) {
      console.warn(`  Skipped image ${image.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  console.log(`Images: ${Object.keys(images).length}/${imageObjects.length} downloaded`);

  const data: CatalogExport = {
    exportedAt: new Date().toISOString(),
    locationId: location.id,
    objects,
    stock,
    images,
  };
  await writeFile(EXPORT_FILE, stringify(data));
  console.log(`Wrote ${path.relative(ROOT, EXPORT_FILE)}`);
}

// ---------------------------------------------------------------------------
// import: square-export/ → sandbox
// ---------------------------------------------------------------------------

/** Server-managed or location-specific fields that can't be copied to another account. */
const STRIP_KEYS = new Set([
  "version",
  "updatedAt",
  "createdAt",
  "isDeleted",
  "catalogV1Ids",
  "presentAtLocationIds",
  "absentAtLocationIds",
  "locationOverrides",
  "imageIds",
  "ecomUri",
  "ecomImageUris",
  "ecomSeoData",
  "channels",
  "onlineVisibility",
  "rootCategory",
  "pathToRoot",
  "descriptionPlaintext",
  "itemOptionValues",
  "teamMemberIds",
  "availablePeriodIds",
  "kitchenName",
]);

/** Deep-copies `value`, dropping STRIP_KEYS and replacing any string found in `ids`. */
function rewrite(value: unknown, ids: Map<string, string>): unknown {
  if (typeof value === "string") return ids.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => rewrite(v, ids));
  if (value && typeof value === "object" && typeof value !== "bigint") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (STRIP_KEYS.has(key) || v === null || v === undefined) continue;
      out[key] = rewrite(v, ids);
    }
    if ("presentAtAllLocations" in out) out.presentAtAllLocations = true;
    return out;
  }
  return value;
}

function prepare(object: Square.CatalogObject, ids: Map<string, string>): Square.CatalogObject {
  const copy = rewrite(object, ids) as Square.CatalogObject;
  copy.presentAtAllLocations = true;
  if (copy.type === "ITEM" && copy.itemData) {
    // `description` and `descriptionHtml` can't both be set.
    if (copy.itemData.descriptionHtml) delete copy.itemData.description;
    for (const variation of copy.itemData.variations ?? []) variation.presentAtAllLocations = true;
  }
  return copy;
}

async function upsert(square: SquareClient, objects: Square.CatalogObject[], ids: Map<string, string>): Promise<void> {
  for (const batch of chunk(objects, 1000)) {
    const response = await withRetry("batchUpsert", () =>
      square.catalog.batchUpsert({ idempotencyKey: randomUUID(), batches: [{ objects: batch }] })
    );
    for (const mapping of response.idMappings ?? []) {
      if (mapping.clientObjectId && mapping.objectId) {
        ids.set(mapping.clientObjectId.slice(1), mapping.objectId);
      }
    }
    console.log(`  upserted ${batch.length} objects`);
  }
}

async function runImport(): Promise<void> {
  const data = await loadExport();
  const square = client("sandbox");

  const { locations = [] } = await square.locations.list();
  const location = locations.find((l) => l.status === "ACTIVE");
  if (!location?.id) throw new Error("The sandbox account has no active location.");
  const { objects: existing = [] } = await square.catalog.search({ objectTypes: ["ITEM"], limit: 1 });
  if (existing.length && !process.argv.includes("--force")) {
    throw new Error("The sandbox catalog already has items. Clear it in the Square sandbox dashboard or pass --force.");
  }
  console.log(`Sandbox location: ${location.name ?? location.id}`);

  // Old ID → new ID. Each phase's objects are sent with temporary "#<oldId>" IDs.
  const ids = new Map<string, string>();
  const temp = (objects: CatalogObject[]) => {
    const map = new Map(ids);
    for (const o of objects) {
      map.set(o.id, `#${o.id}`);
      for (const v of variationsOf(o)) map.set(v.id, `#${v.id}`);
    }
    return map;
  };

  // Categories with a parent must come after the parent.
  const support = data.objects
    .filter((o) => SUPPORT_TYPES.has(o.type))
    .sort((a, b) => Number(a.type === "CATEGORY" && Boolean(a.categoryData?.parentCategory)) -
      Number(b.type === "CATEGORY" && Boolean(b.categoryData?.parentCategory)));
  console.log(`Phase 1: ${support.length} categories, taxes, options and modifier lists`);
  const supportIds = temp(support);
  await upsert(square, support.map((o) => prepare(o, supportIds)), ids);

  const items = data.objects.filter((o) => o.type === "ITEM");
  console.log(`Phase 2: ${items.length} items`);
  const itemIds = temp(items);
  await upsert(square, items.map((o) => prepare(o, itemIds)), ids);

  const itemByImage = new Map<string, { itemId: string; primary: boolean }>();
  for (const item of items) {
    const imageIds = item.type === "ITEM" ? (item.itemData?.imageIds ?? []) : [];
    imageIds.forEach((imageId, index) => {
      const itemId = ids.get(item.id);
      if (itemId && !itemByImage.has(imageId)) itemByImage.set(imageId, { itemId, primary: index === 0 });
    });
  }
  const uploads = [...itemByImage].filter(([imageId]) => data.images[imageId]);
  console.log(`Phase 3: ${uploads.length} images`);
  let uploaded = 0;
  await mapLimit(uploads, 4, async ([imageId, { itemId, primary }]) => {
    const bytes = await readFile(path.join(IMAGE_DIR, data.images[imageId]));
    const source = data.objects.find((o) => o.id === imageId);
    const name = source?.type === "IMAGE" ? (source.imageData?.name ?? imageId) : imageId;
    try {
      await withRetry("image upload", () =>
        square.catalog.images.create({
          request: {
            idempotencyKey: randomUUID(),
            objectId: itemId,
            isPrimary: primary,
            image: { type: "IMAGE", id: `#${imageId}`, imageData: { name } },
          },
          imageFile: new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }),
        })
      );
      uploaded++;
    } catch (error) {
      console.warn(`  Skipped image ${imageId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  console.log(`  uploaded ${uploaded}`);

  const occurredAt = new Date().toISOString();
  const changes: Square.InventoryChange[] = Object.entries(data.stock).flatMap(([variationId, quantity]) => {
    const newId = ids.get(variationId);
    return newId && quantity > 0
      ? [{
          type: "PHYSICAL_COUNT" as const,
          physicalCount: {
            catalogObjectId: newId,
            state: "IN_STOCK" as const,
            quantity: String(quantity),
            locationId: location.id,
            occurredAt,
          },
        }]
      : [];
  });
  console.log(`Phase 4: stock for ${changes.length} variations`);
  for (const batch of chunk(changes, 100)) {
    await withRetry("inventory", () =>
      square.inventory.batchCreateChanges({ idempotencyKey: randomUUID(), changes: batch, ignoreUnchangedCounts: true })
    );
  }

  const categories: Record<string, string> = {};
  for (const o of data.objects) {
    const newId = o.type === "CATEGORY" ? ids.get(o.id) : undefined;
    if (newId) categories[o.id] = newId;
  }
  await writeFile(MAP_FILE, `${JSON.stringify({ locationId: location.id, categories }, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, MAP_FILE)}. Set SQUARE_LOCATION_IDS=${location.id} in .env.local.`);
}

// ---------------------------------------------------------------------------
// fixtures: square-export/ → tests/fixtures/catalog.json (trimmed)
// ---------------------------------------------------------------------------

const PER_CATEGORY = 6;
const POKEMON_ITEMS = 16;

async function runFixtures(): Promise<void> {
  const data = await loadExport();
  const byId = new Map(data.objects.map((o) => [o.id, o]));
  const groupOf = new Map<string, string>();
  for (const [group, mapping] of [["TCG", CATEGORY_MAPPING], ["COLLECTIBLES", COLLECTIBLES_MAPPING], ["SUPPLIES", SUPPLIES_MAPPING]] as const) {
    for (const c of Object.values(mapping)) groupOf.set(c.squareCategoryId, group);
  }

  const categoryIdOf = (item: Square.CatalogObject) =>
    item.type === "ITEM" ? (item.itemData?.categories?.[0]?.id ?? item.itemData?.reportingCategory?.id) : undefined;
  const nameOf = (id: string | undefined) => {
    const c = id ? byId.get(id) : undefined;
    return c?.type === "CATEGORY" ? (c.categoryData?.name ?? undefined) : undefined;
  };
  const hasImage = (item: Square.CatalogObject) =>
    item.type === "ITEM" && (item.itemData?.imageIds ?? []).some((id) => data.images[id]);

  // Pick a spread: more Pokémon, a few per other mapped category, items with images first,
  // mostly in stock with a couple sold out so both filters have results.
  const items = data.objects.filter((o) => o.type === "ITEM" && !o.itemData?.isArchived && variationsOf(o).length > 0);
  const inStock = (item: Square.CatalogObject) => variationsOf(item).some((v) => (data.stock[v.id] ?? 0) > 0);
  const buckets = new Map<string, CatalogObject[]>();
  for (const item of items) {
    const categoryId = categoryIdOf(item);
    if (!categoryId || !groupOf.has(categoryId)) continue;
    buckets.set(categoryId, [...(buckets.get(categoryId) ?? []), item]);
  }
  const chosen: CatalogObject[] = [];
  for (const [categoryId, list] of buckets) {
    const limit = categoryId === CATEGORY_MAPPING.pokemon.squareCategoryId ? POKEMON_ITEMS : PER_CATEGORY;
    const ranked = [...list].sort((a, b) => Number(hasImage(b)) - Number(hasImage(a)) || Number(inStock(b)) - Number(inStock(a)));
    const soldOut = ranked.filter((i) => !inStock(i)).slice(0, 1);
    chosen.push(...ranked.filter((i) => inStock(i)).slice(0, limit - soldOut.length), ...soldOut);
  }

  await mkdir(FIXTURE_IMAGE_DIR, { recursive: true });
  const fixtureImage = async (imageId: string): Promise<string | undefined> => {
    const file = data.images[imageId];
    if (!file) return undefined;
    const out = `${imageId}.webp`;
    // Same cleaning the live site gets (scripts/images/sync.ts), at fixture size.
    const cleaned = await processImage(await readFile(path.join(IMAGE_DIR, file)));
    await sharp(cleaned.data).resize(480, 480, { fit: "inside" }).webp({ quality: 76, alphaQuality: 85 }).toFile(path.join(FIXTURE_IMAGE_DIR, out));
    return `/fixtures/catalog/${out}`;
  };

  const catalogItems: CatalogItem[] = [];
  const products: Product[] = [];
  for (const item of chosen) {
    if (item.type !== "ITEM" || !item.itemData) continue;
    const categoryId = categoryIdOf(item);
    const imageUrls = (await Promise.all((item.itemData.imageIds ?? []).slice(0, 2).map(fixtureImage))).filter(
      (u): u is string => Boolean(u)
    );
    const description = item.itemData.descriptionPlaintext ?? item.itemData.description ?? "";
    const variations = variationsOf(item).flatMap((v) => (v.type === "ITEM_VARIATION" ? [v] : []));

    products.push(productSchema.parse({
      id: item.id,
      name: item.itemData.name ?? "",
      description,
      imageUrls,
      categoryName: nameOf(categoryId),
      variations: variations.map((v) => ({
        id: v.id,
        name: v.itemVariationData?.name ?? "Regular",
        priceAmount: Number(v.itemVariationData?.priceMoney?.amount ?? 0),
        priceCurrency: v.itemVariationData?.priceMoney?.currency ?? "USD",
        soldOut: (data.stock[v.id] ?? 0) <= 0,
        inventoryCount: data.stock[v.id] ?? 0,
      })),
    }));
    for (const v of variations) {
      catalogItems.push(catalogItemSchema.parse({
        itemId: item.id,
        variationId: v.id,
        name: item.itemData.name ?? "",
        description,
        imageUrls,
        sku: v.itemVariationData?.sku ?? "",
        priceAmount: Number(v.itemVariationData?.priceMoney?.amount ?? 0),
        priceCurrency: v.itemVariationData?.priceMoney?.currency ?? "USD",
        soldOut: (data.stock[v.id] ?? 0) <= 0,
        categoryId,
        categoryName: nameOf(categoryId),
        group: categoryId ? groupOf.get(categoryId) : undefined,
        inventoryCount: data.stock[v.id] ?? 0,
      }));
    }
  }

  const fixture = {
    _note: `Trimmed snapshot of the Square catalog (${data.exportedAt.slice(0, 10)}), used when CATALOG_SOURCE=fixtures. Regenerate with \`npx tsx scripts/square/clone-catalog.ts fixtures\`.`,
    items: catalogItems,
    products,
  };
  await writeFile(FIXTURE_FILE, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`Wrote ${products.length} products (${catalogItems.length} variations) to ${path.relative(ROOT, FIXTURE_FILE)}`);
}

// ---------------------------------------------------------------------------

const commands = { export: runExport, import: runImport, fixtures: runFixtures } as const;
const command = process.argv[2];
if (command !== "export" && command !== "import" && command !== "fixtures") {
  console.error("Usage: npx tsx scripts/square/clone-catalog.ts <export|import|fixtures> [--force]");
  process.exit(1);
}
commands[command]().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
