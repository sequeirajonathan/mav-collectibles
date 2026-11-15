import { CATEGORY_GROUP_SLUGS, CATEGORY_MAPPING, COLLECTIBLES_MAPPING, SUPPLIES_MAPPING } from "@const/categories";

/**
 * Square holds more than sellable products: the shop also records marketplace
 * orders there as "items", with customer names in them. Only items in a
 * category the shop menu links to are public, and anything that looks like an
 * order record is hidden wherever it is filed. Applies to category pages,
 * search and product pages alike.
 */
const PUBLIC_CATEGORY_IDS = new Set<string>([
  ...[CATEGORY_MAPPING, COLLECTIBLES_MAPPING, SUPPLIES_MAPPING].flatMap((m) => Object.values(m).map((c) => c.squareCategoryId)),
  ...Object.values(CATEGORY_GROUP_SLUGS).flat(),
]);

// "Order# 13E4…", "Order: 13E4…", or a bare marketplace order number such as
// 13E4CA7E-F9DE2C-87B6F. ("Pre-Order: Booster Box" is a product, not an order.)
const ORDER_RECORD = /(?<!pre[- ]?)\border\s*[#:]\s*[0-9A-F]{4,}|\b[0-9A-F]{8}-[0-9A-F]{6}-[0-9A-F]{5}\b/i;

export function isPublicCatalogItem(item: { name: string; description?: string | null; categoryIds: (string | null | undefined)[] }): boolean {
  if (ORDER_RECORD.test(item.name) || ORDER_RECORD.test(item.description ?? "")) return false;
  return item.categoryIds.some((id) => Boolean(id) && PUBLIC_CATEGORY_IDS.has(id ?? ""));
}
