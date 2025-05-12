import {
  NormalizedCatalogItem,
  NormalizedCatalogResponse,
  ItemVariationObject,
  ItemObject,
  SearchCatalogObjectsResponse,
  GetCatalogObjectResponse,
  InventoryCount,
  NormalizedProductResponse,
} from "@interfaces";
import { CATEGORY_GROUPS } from "@const/categories";


export function normalizeCatalogItems(
  response: SearchCatalogObjectsResponse,
  options: {
    stock?: string;
  } = {}
): NormalizedCatalogResponse {
  const { stock = "IN_STOCK" } = options;

  // Support multi-select stock filter
  const stockArray = stock
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const stockSet = new Set(stockArray);
  const filterByStock = (isSoldOut: boolean) => {
    // If both in set, always show
    if (stockSet.has("IN_STOCK") && stockSet.has("SOLD_OUT")) return true;
    if (stockSet.has("IN_STOCK") && !isSoldOut) return true;
    if (stockSet.has("SOLD_OUT") && isSoldOut) return true;
    return false;
  };

  const items: NormalizedCatalogItem[] = [];

  // Build lookup maps for related objects
  const imageUrlMap = new Map<string, string>();
  const categoryMap = new Map<string, string>();
  const taxMap = new Map<string, { name: string; percentage?: string }>();

  // Process related objects first
  for (const obj of response.relatedObjects ?? []) {
    switch (obj.type) {
      case "IMAGE":
        imageUrlMap.set(obj.id, obj.imageData?.url ?? "");
        break;
      case "CATEGORY":
        if (obj.categoryData?.name && obj.id) {
          categoryMap.set(obj.id, obj.categoryData.name);
        }
        break;
      case "TAX":
        if (obj.taxData?.name) {
          taxMap.set(obj.id, {
            name: obj.taxData.name,
            percentage: obj.taxData.percentage ?? undefined,
          });
        }
        break;
    }
  }

  // Process items from the response
  for (const object of response.objects ?? []) {
    if (object.type !== "ITEM") continue;
    const item = object as ItemObject;
    const itemData = item.itemData;
    if (!itemData) continue;

    const categoryId = itemData.categories?.[0]?.id ?? "";
    const categoryName = categoryMap.get(categoryId) ?? "";
    const group = categoryId
      ? CATEGORY_GROUPS.find((group) =>
          group.categories.some((cat) => cat.squareCategoryId === categoryId)
        )?.name
      : undefined;

    const imageUrls =
      itemData.imageIds
        ?.map((id) => imageUrlMap.get(id) ?? "")
        .filter(Boolean) ?? [];
    const taxInfo =
      itemData.taxIds
        ?.map((id) => taxMap.get(id))
        .filter((tax): tax is { name: string; percentage?: string } => !!tax) ??
      [];

    // Process variations to find the first available one that matches our stock filter
    let selectedVariation: ItemVariationObject["itemVariationData"] | null = null;
    let selectedVariationId = "";
    let selectedPrice = Infinity;
    let isItemSoldOut = true; // Default to true, will be false if we find any available variation

    for (const variationEntry of itemData.variations ?? []) {
      if (variationEntry.type !== "ITEM_VARIATION") continue;
      const variation = (variationEntry as ItemVariationObject).itemVariationData;
      const variationId = variationEntry.id ?? "";
      if (!variation) continue;

      const isVariationSoldOut = (variation.trackInventory && variation.locationOverrides?.some(override => override.soldOut)) ?? false;
      
      // If this variation is available and matches our stock filter
      if (!isVariationSoldOut && filterByStock(false)) {
        const price = Number(variation.priceMoney?.amount ?? Infinity);
        if (price < selectedPrice) {
          selectedPrice = price;
          selectedVariation = variation;
          selectedVariationId = variationId;
          isItemSoldOut = false;
        }
      }
      // If we're showing sold out items and this one is sold out
      else if (isVariationSoldOut && filterByStock(true)) {
        const price = Number(variation.priceMoney?.amount ?? Infinity);
        if (price < selectedPrice) {
          selectedPrice = price;
          selectedVariation = variation;
          selectedVariationId = variationId;
        }
      }
    }

    if (!selectedVariation) continue;

    items.push({
      itemId: item.id,
      variationId: selectedVariationId,
      name: itemData.name ?? "",
      description: itemData.description ?? "",
      imageUrls,
      categoryId,
      categoryName,
      group,
      taxInfo,
      taxIds: itemData.taxIds ?? [],
      priceAmount: selectedPrice,
      priceCurrency: selectedVariation.priceMoney?.currency ?? "USD",
      isTaxable: itemData.isTaxable ?? false,
      sku: selectedVariation.sku ?? "",
      isArchived: itemData.isArchived ?? false,
      updatedAt: item.updatedAt ?? "",
      soldOut: isItemSoldOut,
      presentAtAllLocations: item.presentAtAllLocations ?? false,
      presentAtLocationIds: item.presentAtLocationIds ?? [],
      ecomAvailable: itemData.ecom_available ?? false,
      ecomVisibility: itemData.ecom_visibility ?? "UNINDEXED",
    });
  }

  return {
    items,
    cursor: response.cursor ?? null,
  };
}


export function normalizeProductResponse(
  catalogObject: GetCatalogObjectResponse,
  inventoryObject: { counts: InventoryCount[] },
  locationId: string
): NormalizedProductResponse {
  // Build maps of related objects
  const imageUrlMap = new Map<string, string>();
  const categoryMap = new Map<string, { id: string; name: string }>();
  const taxMap = new Map<
    string,
    { id: string; name: string; percentage: string }
  >();

  // Process related objects first to build our lookup maps
  for (const obj of catalogObject.relatedObjects ?? []) {
    switch (obj.type) {
      case "IMAGE":
        if (obj.imageData?.url) {
          imageUrlMap.set(obj.id, obj.imageData.url);
        }
        break;
      case "CATEGORY":
        if (obj.categoryData?.name && obj.id) {
          categoryMap.set(obj.id, {
            id: obj.id,
            name: obj.categoryData.name,
          });
        }
        break;
      case "TAX":
        if (obj.taxData?.name) {
          taxMap.set(obj.id, {
            id: obj.id,
            name: obj.taxData.name,
            percentage: obj.taxData.percentage?.toString() ?? "0",
          });
        }
        break;
    }
  }

  if (!catalogObject.object || catalogObject.object.type !== "ITEM") {
    throw new Error("Item data not found");
  }

  const itemData = (catalogObject.object as ItemObject).itemData;
  if (!itemData) {
    throw new Error("Item data not found");
  }

  const categoryId = itemData.categories?.[0]?.id;
  const categoryInfo = categoryId ? categoryMap.get(categoryId) : undefined;

  const imageUrls =
    itemData.imageIds
      ?.map((id: string) => imageUrlMap.get(id) ?? "")
      .filter(Boolean) ?? [];

  const taxInfo =
    itemData.taxIds
      ?.map((id: string) => taxMap.get(id))
      .filter(
        (tax): tax is { id: string; name: string; percentage: string } =>
          tax !== undefined
      ) ?? [];

  // Process variations with inventory
  const variations =
    itemData.variations
      ?.map((variation) => {
        if (variation.type !== "ITEM_VARIATION") return null;
        const variationData = (variation as ItemVariationObject)
          .itemVariationData;
        const variationId = variation.id ?? "";

        // Find inventory count for this specific variation
        const inventoryCount = Number(
          inventoryObject.counts.find(
            (count) =>
              count.catalogObjectId === variationId &&
              count.locationId === locationId
          )?.quantity ?? 0
        );

        const inventoryLocation = inventoryObject.counts.find(
          (count) =>
            count.catalogObjectId === variationId &&
            count.locationId === locationId
        )?.locationId;

        const inventoryState = inventoryObject.counts.find(
          (count) =>
            count.catalogObjectId === variationId &&
            count.locationId === locationId
        )?.state;

        // Check if the variation is sold out based on trackInventory and locationOverrides
        const isSoldOut = (variationData.trackInventory && variationData.locationOverrides?.some(override => override.soldOut)) ?? false;

        return {
          id: variationId,
          name: variationData.name ?? "",
          sku: variationData.sku ?? "",
          upc: variationData.upc ?? undefined,
          priceAmount: Number(variationData.priceMoney?.amount ?? 0),
          priceCurrency: variationData.priceMoney?.currency ?? "USD",
          inventoryCount,
          soldOut: isSoldOut,
          locationInventory: [
            {
              locationId: inventoryLocation ?? "",
              quantity: inventoryCount,
              state: inventoryState ?? "IN_STOCK",
            },
          ],
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null) ?? [];

  return {
    id: catalogObject.object.id ?? "",
    name: itemData.name ?? "",
    description: itemData.description ?? "",
    descriptionHtml: itemData.descriptionHtml ?? undefined,
    descriptionPlaintext: itemData.descriptionPlaintext ?? undefined,
    imageIds: itemData.imageIds ?? [],
    imageUrls,
    variations,
    category: categoryInfo ?? { id: "", name: "" },
    taxInfo,
    isTaxable: itemData.isTaxable ?? false,
    isArchived: itemData.isArchived ?? false,
    ecomAvailable: itemData.ecom_available ?? false,
    ecomVisibility: itemData.ecom_visibility ?? "UNINDEXED",
    updatedAt: catalogObject.object.updatedAt ?? "",
  };
}