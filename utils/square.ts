import {
  NormalizedCatalogItem,
  NormalizedCatalogResponse,
  ItemVariationObject,
  ItemObject,
  SearchCatalogObjectsResponse,
  GetCatalogObjectResponse,
  InventoryCount,
  NormalizedProductResponse
} from '@interfaces';
import { CATEGORY_GROUPS } from '@const/categories';

export function normalizeCatalogResponse(
  search: SearchCatalogObjectsResponse
): NormalizedCatalogResponse {
  const items: NormalizedCatalogItem[] = [];

  // First, build maps of related objects
  const imageUrlMap = new Map<string, string>();
  const categoryMap = new Map<string, { name: string }>();
  const taxMap = new Map<string, { name: string; percentage?: string }>();

  // Process related objects first to build our lookup maps
  for (const obj of search.relatedObjects ?? []) {
    switch (obj.type) {
      case 'IMAGE':
        if (obj.imageData?.url) {
          imageUrlMap.set(obj.id, obj.imageData.url);
        }
        break;
      case 'CATEGORY':
        if (obj.categoryData?.name && obj.id) {
          categoryMap.set(obj.id, { name: obj.categoryData.name });
        }
        break;
      case 'TAX':
        if (obj.taxData?.name) {
          taxMap.set(obj.id, {
            name: obj.taxData.name,
            percentage: obj.taxData.percentage?.toString()
          });
        }
        break;
    }
  }

  const findCategoryGroup = (categoryName: string): string | undefined => {
    for (const group of CATEGORY_GROUPS) {
      if (group.categories.some(cat => cat.squareCategory === categoryName)) {
        return group.name;
      }
    }
    return undefined;
  };

  // Process items and their variations
  for (const object of search.objects ?? []) {
    if (object.type !== 'ITEM') continue;

    const item = object as ItemObject;
    const itemData = item.itemData;
    if (!itemData) continue;

    const imageUrls = itemData.imageIds
      ?.map(id => imageUrlMap.get(id) ?? '')
      .filter(Boolean) ?? [];

    const categoryId = itemData.categories?.[0]?.id;
    const categoryInfo = categoryId ? categoryMap.get(categoryId) : undefined;
    const categoryName = categoryInfo?.name;
    const group = categoryName ? findCategoryGroup(categoryName) : undefined;

    const taxInfo = itemData.taxIds
      ?.map(id => taxMap.get(id))
      .filter((tax): tax is { name: string; percentage?: string } => tax !== undefined) ?? [];

    for (const variationEntry of itemData.variations ?? []) {
      if (variationEntry.type !== 'ITEM_VARIATION') continue;

      const variation = (variationEntry as ItemVariationObject).itemVariationData;
      if (!variation) continue;

      const soldOut = (variation.locationOverrides?.some(loc => loc.soldOut) ?? false);

      items.push({
        itemId: variation.itemId ?? '',
        variationId: variationEntry.id ?? '',
        name: itemData.name ?? '',
        description: itemData.description ?? '',
        imageIds: itemData.imageIds ?? [],
        imageUrls,
        sku: variation.sku ?? '',
        priceAmount: Number(variation.priceMoney?.amount ?? 0),
        priceCurrency: variation.priceMoney?.currency ?? 'USD',
        isTaxable: itemData.isTaxable ?? false,
        taxIds: itemData.taxIds ?? [],
        taxInfo,
        isArchived: itemData.isArchived ?? false,
        updatedAt: object.updatedAt ?? '',
        soldOut,
        presentAtAllLocations: variationEntry.presentAtAllLocations ?? false,
        presentAtLocationIds: variationEntry.presentAtLocationIds ?? [],
        ecomAvailable: itemData.ecom_available ?? false,
        ecomVisibility: itemData.ecom_visibility ?? 'UNINDEXED',
        categoryId,
        categoryInfo,
        categoryName,
        group,
      });
    }
  }

  return {
    items,
    cursor: search?.cursor ?? null,
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
  const taxMap = new Map<string, { id: string; name: string; percentage: string }>();

  // Process related objects first to build our lookup maps
  for (const obj of catalogObject.relatedObjects ?? []) {
    switch (obj.type) {
      case 'IMAGE':
        if (obj.imageData?.url) {
          imageUrlMap.set(obj.id, obj.imageData.url);
        }
        break;
      case 'CATEGORY':
        if (obj.categoryData?.name && obj.id) {
          categoryMap.set(obj.id, {
            id: obj.id,
            name: obj.categoryData.name
          });
        }
        break;
      case 'TAX':
        if (obj.taxData?.name) {
          taxMap.set(obj.id, {
            id: obj.id,
            name: obj.taxData.name,
            percentage: obj.taxData.percentage?.toString() ?? "0"
          });
        }
        break;
    }
  }

  if (!catalogObject.object || catalogObject.object.type !== 'ITEM') {
    throw new Error('Item data not found');
  }

  const itemData = (catalogObject.object as ItemObject).itemData;
  if (!itemData) {
    throw new Error('Item data not found');
  }

  const categoryId = itemData.categories?.[0]?.id;
  const categoryInfo = categoryId ? categoryMap.get(categoryId) : undefined;

  const imageUrls = itemData.imageIds
    ?.map((id: string) => imageUrlMap.get(id) ?? '')
    .filter(Boolean) ?? [];

  const taxInfo = itemData.taxIds
    ?.map((id: string) => taxMap.get(id))
    .filter((tax): tax is { id: string; name: string; percentage: string } => tax !== undefined) ?? [];

  // Process variations with inventory
  const variations = itemData.variations?.map(variation => {
    if (variation.type !== 'ITEM_VARIATION') return null;
    const variationData = (variation as ItemVariationObject).itemVariationData;
    const inventoryCount = Number(inventoryObject.counts.find((count) => count.locationId === locationId)?.quantity ?? 0);
    const inventoryLocation = inventoryObject.counts.find((count) => count.locationId === locationId)?.locationId;
    const inventoryState = inventoryObject.counts.find((count) => count.locationId === locationId)?.state;

    return {
      id: variation.id ?? '',
      name: variationData.name ?? '',
      sku: variationData.sku ?? '',
      upc: variationData.upc ?? undefined,
      priceAmount: Number(variationData.priceMoney?.amount ?? 0),
      priceCurrency: variationData.priceMoney?.currency ?? 'USD',
      inventoryCount,
      locationInventory: [{
        locationId: inventoryLocation ?? '',
        quantity: inventoryCount,
        state: inventoryState ?? 'IN_STOCK'
      }]
    };
  }).filter((v): v is NonNullable<typeof v> => v !== null) ?? [];

  return {
    id: catalogObject.object.id ?? '',
    name: itemData.name ?? '',
    description: itemData.description ?? '',
    descriptionHtml: itemData.descriptionHtml ?? undefined,
    descriptionPlaintext: itemData.descriptionPlaintext ?? undefined,
    imageIds: itemData.imageIds ?? [],
    imageUrls,
    variations,
    category: categoryInfo ?? { id: '', name: '' },
    taxInfo,
    isTaxable: itemData.isTaxable ?? false,
    isArchived: itemData.isArchived ?? false,
    ecomAvailable: itemData.ecom_available ?? false,
    ecomVisibility: itemData.ecom_visibility ?? 'UNINDEXED',
    updatedAt: catalogObject.object.updatedAt ?? ''
  };
} 