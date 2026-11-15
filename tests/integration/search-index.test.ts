import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@lib/prisma";
import { searchIndex, searchIndexReady, searchIndexStatus, syncSearchIndex } from "@lib/catalog/search-index";
import type { CatalogSource, IndexableItem, ListOptions } from "@lib/catalog/source";

const item = (id: string, name: string, extra: Partial<IndexableItem> = {}): IndexableItem => ({
  itemId: id,
  variationId: `${id}-V`,
  variationIds: [`${id}-V`],
  name,
  description: "",
  imageUrls: [],
  sku: id,
  priceAmount: 500,
  priceCurrency: "USD",
  soldOut: false,
  inventoryCount: 3,
  ...extra,
});

const ITEMS = [
  item("A", "Monkey.D.Luffy - Legacy of the Master (OP12)"),
  item("B", "Luffy Pikachu Mini Figure Token"),
  item("C", "Charizard ex - 006/165 - SV: Scarlet & Violet 151"),
  item("D", "Obsidian Flames Booster Pack", { description: "Chance at Charizard ex." }),
  item("E", "Umbreon VMAX (Secret) - 214/203 - Evolving Skies", { soldOut: true, inventoryCount: 0 }),
  item("F", "Pokémon Elite Trainer Box - Surging Sparks"),
];

function source(items: IndexableItem[], liveStock?: CatalogSource["liveStock"]): CatalogSource {
  const unused = () => Promise.reject(new Error("not used"));
  return { listByCategories: unused, search: unused, getProduct: unused, listAll: () => Promise.resolve(items), liveStock };
}

const ANY: ListOptions = { stock: "IN_STOCK,SOLD_OUT", sort: "name_asc", limit: 24 };
const names = async (query: string, options: ListOptions = ANY, src = source(ITEMS)) => (await searchIndex(src, query, options)).items.map((i) => i.name);

describe("catalog search index", () => {
  beforeAll(async () => {
    await syncSearchIndex(source(ITEMS));
  });
  afterAll(async () => {
    await prisma.catalogSearch.deleteMany();
    await prisma.catalogSearchSync.update({ where: { id: 1 }, data: { started_at: null, finished_at: null, item_count: 0, error: null } });
  });

  it("records what it indexed", async () => {
    expect(await searchIndexReady()).toBe(true);
    const status = await searchIndexStatus();
    expect(status.itemCount).toBe(ITEMS.length);
    expect(status.running).toBe(false);
    expect(status.error).toBeNull();
  });

  it("finds a word inside a name written with dots", async () => {
    expect(await names("luffy")).toEqual(["Luffy Pikachu Mini Figure Token", "Monkey.D.Luffy - Legacy of the Master (OP12)"]);
  });

  it("puts products named for the search ahead of description-only matches", async () => {
    expect(await names("charizard ex")).toEqual(["Charizard ex - 006/165 - SV: Scarlet & Violet 151", "Obsidian Flames Booster Pack"]);
  });

  it("forgives typos and still ranks the intended product first", async () => {
    expect((await names("charzard"))[0]).toBe("Charizard ex - 006/165 - SV: Scarlet & Violet 151");
    expect(await names("umbrion vmax")).toEqual(["Umbreon VMAX (Secret) - 214/203 - Evolving Skies"]);
  });

  it("understands shorthand, accents and card numbers", async () => {
    expect(await names("etb")).toEqual(["Pokémon Elite Trainer Box - Surging Sparks"]);
    expect(await names("pokemon elite")).toEqual(["Pokémon Elite Trainer Box - Surging Sparks"]);
    expect(await names("214/203")).toEqual(["Umbreon VMAX (Secret) - 214/203 - Evolving Skies"]);
  });

  it("filters by the indexed stock when the source can't check live", async () => {
    expect(await names("umbreon", { ...ANY, stock: "IN_STOCK" })).toEqual([]);
    expect(await names("umbreon", { ...ANY, stock: "SOLD_OUT" })).toHaveLength(1);
  });

  it("trusts live stock over the index", async () => {
    // Since the last sync, Umbreon was restocked and the Charizard sold.
    const live = source(ITEMS, () => Promise.resolve(new Map([["E-V", 2]])));
    expect(await names("umbreon", { ...ANY, stock: "IN_STOCK" }, live)).toHaveLength(1);
    expect(await names("charizard ex 006", { ...ANY, stock: "IN_STOCK" }, live)).toEqual([]);
    const page = await searchIndex(live, "umbreon", ANY);
    expect(page.items[0]).toMatchObject({ soldOut: false, inventoryCount: 2 });
  });

  it("pages through ranked results", async () => {
    const first = await searchIndex(source(ITEMS), "luffy", { ...ANY, limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.cursor).not.toBeNull();
    const second = await searchIndex(source(ITEMS), "luffy", { ...ANY, limit: 1, cursor: first.cursor ?? undefined });
    expect(second.items[0].name).toBe("Monkey.D.Luffy - Legacy of the Master (OP12)");
    expect(second.cursor).toBeNull();
  });

  it("keeps the existing index when the catalog can't be read", async () => {
    await expect(syncSearchIndex(source([]))).rejects.toThrow(/no products/);
    expect(await prisma.catalogSearch.count()).toBe(ITEMS.length);
    expect((await searchIndexStatus()).error).toMatch(/no products/);
  });
});
