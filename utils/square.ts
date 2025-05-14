import {
  NormalizedCatalogItem,
  NormalizedCatalogResponse,
  ItemVariationObject,
  ItemObject,
  SearchCatalogObjectsResponse,
  GetCatalogObjectResponse,
  InventoryCount,
  NormalizedProductResponse,
  CatalogObject
} from "@interfaces";
import { CATEGORY_GROUPS } from "@const/categories";
import { serializeBigIntValues } from "./serialization";
import { EcomVisibility } from '../interfaces/square';
import { Square } from 'square';

export function isCatalogItem(o: CatalogObject): o is CatalogObject & { type: "ITEM" } {
  return o.type === "ITEM";
}

export function normalizeCatalogItems(
  response: SearchCatalogObjectsResponse,
  options: {
    stock?: string;
    inventory?: Record<string, number>;
  } = {}
): NormalizedCatalogResponse {
  const { stock = "IN_STOCK", inventory = {} } = options;

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
    const itemData = item.itemData as Square.CatalogItem & {
      ecom_available?: boolean;
      ecom_visibility?: EcomVisibility;
    };
    if (!itemData) continue;

    // Skip items that are not available for ecommerce
    if (!itemData.ecom_available || itemData.ecom_visibility === "UNAVAILABLE") continue;

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

    // Process all variations that match our stock filter
    for (const variationEntry of itemData.variations ?? []) {
      if (variationEntry.type !== "ITEM_VARIATION") continue;
      const variation = (variationEntry as ItemVariationObject).itemVariationData;
      const variationId = variationEntry.id ?? "";
      if (!variation) continue;

      const isVariationSoldOut = (variation.trackInventory && variation.locationOverrides?.some(override => override.soldOut)) ?? false;
      
      // Only include variations that match our stock filter
      if (filterByStock(isVariationSoldOut)) {
        items.push({
          itemId: item.id,
          variationId,
          name: itemData.name ?? "",
          description: itemData.description ?? "",
          imageUrls,
          categoryId,
          categoryName,
          group,
          taxInfo,
          taxIds: itemData.taxIds ?? [],
          priceAmount: Number(variation.priceMoney?.amount ?? 0),
          priceCurrency: variation.priceMoney?.currency ?? "USD",
          isTaxable: itemData.isTaxable ?? false,
          sku: variation.sku ?? "",
          isArchived: itemData.isArchived ?? false,
          updatedAt: item.updatedAt ?? "",
          soldOut: isVariationSoldOut,
          presentAtAllLocations: item.presentAtAllLocations ?? false,
          presentAtLocationIds: item.presentAtLocationIds ?? [],
          ecomAvailable: itemData.ecom_available ?? false,
          ecomVisibility: itemData.ecom_visibility ?? 'UNINDEXED',
          inventoryCount: inventory[variationId] ?? 0,
        });
      }
    }
  }

  return {
    items,
    cursor: response.cursor ?? undefined,
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
    ecomVisibility: itemData.ecom_visibility ?? 'UNINDEXED',
    updatedAt: catalogObject.object.updatedAt ?? "",
  };
}

export interface NormalizedItemWithInventory {
  id: string;
  name: string;
  description: string;
  descriptionPlaintext: string;
  descriptionHtml: string;
  imageIds: string[];
  ecom_available: boolean;
  ecom_visibility: string;
  variations: {
    id: string;
    name: string;
    sku: string;
    price: number;
    inventory: number;
    trackInventory: boolean;
    sellable: boolean;
    stockable: boolean;
  }[];
  categories: {
    id: string;
    ordinal: string;
  }[];
  isArchived: boolean;
  isAlcoholic: boolean;
  isTaxable: boolean;
  taxIds: string[];
  channels: string[];
  reportingCategory: {
    id: string;
    ordinal: string;
  };
}

export function normalizeItemsWithInventory(
  items: CatalogObject[],
  relatedObjects?: CatalogObject[]
): NormalizedCatalogItem[] {
  // Build lookup maps for related objects
  const imageUrlMap = new Map<string, string>();
  const categoryMap = new Map<string, { id: string; name: string }>();
  const taxMap = new Map<string, { name: string; percentage?: string }>();

  // Process related objects first
  for (const obj of relatedObjects ?? []) {
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
            name: obj.categoryData.name
          });
        }
        break;
      case "TAX":
        if (obj.taxData?.name) {
          taxMap.set(obj.id, {
            name: obj.taxData.name,
            percentage: obj.taxData.percentage ?? undefined
          });
        }
        break;
    }
  }

  return items
    .filter((item): item is CatalogObject & { type: "ITEM" } => isCatalogItem(item))
    .flatMap(item => {
      const itemData = item.itemData as Square.CatalogItem & {
        ecom_available?: boolean;
        ecom_visibility?: EcomVisibility;
      };
      if (!itemData) return [];

      // Get category info
      const categoryId = itemData.categories?.[0]?.id ?? '';
      const categoryInfo = categoryId ? categoryMap.get(categoryId) : undefined;

      // Get tax info
      const taxInfo = itemData.taxIds
        ?.map(id => taxMap.get(id))
        .filter((tax): tax is { name: string; percentage?: string } => !!tax) ?? [];

      return itemData.variations?.map(variation => {
        const variationData = (variation as ItemVariationObject).itemVariationData;
        const amount = variationData?.priceMoney?.amount;
        const isSoldOut = variationData?.locationOverrides?.some(override => override.soldOut) ?? false;

        // Get location IDs from the variation's location overrides
        const locationIds = variationData?.locationOverrides
          ?.map(override => override.locationId)
          .filter((id): id is string => id !== null && id !== undefined) ?? [];

        return {
          itemId: item.id ?? '',
          variationId: variation.id ?? '',
          name: itemData.name ?? '',
          description: itemData.description ?? '',
          imageUrls: itemData.imageIds?.map(id => imageUrlMap.get(id) ?? '').filter(Boolean) ?? [],
          categoryId,
          categoryName: categoryInfo?.name ?? '',
          group: '',
          taxInfo,
          taxIds: itemData.taxIds ?? [],
          priceAmount: amount ? Number(serializeBigIntValues('amount', amount)) : 0,
          priceCurrency: variationData?.priceMoney?.currency ?? 'USD',
          isTaxable: itemData.isTaxable ?? false,
          sku: variationData?.sku ?? '',
          isArchived: itemData.isArchived ?? false,
          updatedAt: item.updatedAt ?? '',
          soldOut: isSoldOut,
          presentAtAllLocations: item.presentAtAllLocations ?? false,
          presentAtLocationIds: locationIds,
          ecomAvailable: itemData.ecom_available ?? false,
          ecomVisibility: itemData.ecom_visibility ?? 'UNINDEXED',
          inventoryCount: (variation as { inventory?: number }).inventory ?? 0,
        };
      }) ?? [];
    });
}