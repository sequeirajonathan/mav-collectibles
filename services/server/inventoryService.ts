import { createSquareClient } from "@lib/square";
import { InventoryCount } from "@interfaces";

export async function getInventoryMap(variationIds: string[]): Promise<Record<string, number>> {
  if (!Array.isArray(variationIds) || variationIds.length === 0) return {};

  try {
    const squareClient = createSquareClient();

    const response = await squareClient.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: [], // all locations
    });

    const counts: InventoryCount[] = response.data ?? [];

    const inventoryMap = counts.reduce<Record<string, number>>((acc, count) => {
      const id = count.catalogObjectId;
      const qty = parseFloat(count.quantity ?? "0");
      if (id) acc[id] = (acc[id] || 0) + qty;
      return acc;
    }, {});

    return inventoryMap;
  } catch (error) {
    console.error("[InventoryService] Error getting inventory map:", error);
    return {};
  }
}
