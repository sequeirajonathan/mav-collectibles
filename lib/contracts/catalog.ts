import { z } from "zod";
import { cursorPage } from "./common";

/** A sellable item variation from the Square catalog, flattened for display. */
export const catalogItemSchema = z.object({
  itemId: z.string(),
  variationId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  sku: z.string(),
  priceAmount: z.number(),
  priceCurrency: z.string(),
  soldOut: z.boolean(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  group: z.string().optional(),
  inventoryCount: z.number().optional(),
});
export type CatalogItem = z.infer<typeof catalogItemSchema>;

export const catalogPageSchema = cursorPage(catalogItemSchema);
export type CatalogPage = z.infer<typeof catalogPageSchema>;

const stockFilterSchema = z.enum(["IN_STOCK", "SOLD_OUT", "IN_STOCK,SOLD_OUT"]);
const sortSchema = z.enum(["name_asc", "name_desc"]);

export const categoryQuerySchema = z.object({
  group: z.string().optional(),
  stock: stockFilterSchema.default("IN_STOCK"),
  sort: sortSchema.default("name_asc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1).max(100),
  stock: stockFilterSchema.default("IN_STOCK"),
  sort: sortSchema.default("name_asc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrls: z.array(z.string()),
  categoryName: z.string().optional(),
  variations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      priceAmount: z.number(),
      priceCurrency: z.string(),
      soldOut: z.boolean(),
      inventoryCount: z.number().optional(),
    })
  ),
});
export type Product = z.infer<typeof productSchema>;
