import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Square } from "square";

const findMany = vi.hoisted(() => vi.fn<() => Promise<{ square_image_id: string; path: string; source_url: string }[]>>());
vi.mock("@lib/prisma", () => ({ prisma: { productImage: { findMany } } }));
vi.mock("@lib/env", () => ({ publicEnv: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co" }) }));

const { withProcessedImages } = await import("@lib/catalog/product-images");

const image = (id: string, url: string): Square.CatalogObject => ({ type: "IMAGE", id, imageData: { url } });
const urlOf = (o: Square.CatalogObject) => (o.type === "IMAGE" ? o.imageData?.url : undefined);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withProcessedImages", () => {
  it("swaps in the cleaned copy and leaves unprocessed photos alone", async () => {
    findMany.mockResolvedValue([{ square_image_id: "A", path: "v1/A.webp", source_url: "https://sq/a.jpg" }]);
    const out = await withProcessedImages([image("A", "https://sq/a.jpg"), image("B", "https://sq/b.jpg"), { type: "CATEGORY", id: "C" }]);
    expect(out.map(urlOf)).toEqual(["https://proj.supabase.co/storage/v1/object/public/product-images/v1/A.webp", "https://sq/b.jpg", undefined]);
  });

  it("shows the new original when staff replaced the photo on Square", async () => {
    findMany.mockResolvedValue([{ square_image_id: "A", path: "v1/A.webp", source_url: "https://sq/old.jpg" }]);
    const out = await withProcessedImages([image("A", "https://sq/new.jpg")]);
    expect(out.map(urlOf)).toEqual(["https://sq/new.jpg"]);
  });

  it("falls back to Square originals if the lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    findMany.mockRejectedValue(new Error("db down"));
    const out = await withProcessedImages([image("A", "https://sq/a.jpg")]);
    expect(out.map(urlOf)).toEqual(["https://sq/a.jpg"]);
  });

  it("skips the lookup when there are no photos", async () => {
    expect(await withProcessedImages(undefined)).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
