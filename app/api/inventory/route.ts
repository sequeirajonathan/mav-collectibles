import { NextRequest, NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { InventoryCount } from "@interfaces";

export async function POST(request: NextRequest) {
  try {
    const { variationIds } = await request.json();

    if (!Array.isArray(variationIds) || variationIds.length === 0) {
      return NextResponse.json(
        { error: "No variation IDs provided" },
        { status: 400 }
      );
    }

    const squareClient = createSquareClient();

    const response = await squareClient.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: [], // All locations
    });

    const counts: InventoryCount[] = response.data ?? [];
    
    const inventoryMap = counts.reduce<Record<string, number>>((acc, count) => {
      const id = count.catalogObjectId;
      const qty = parseFloat(count.quantity ?? "0");
      if (id) acc[id] = (acc[id] || 0) + qty;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ inventory: inventoryMap });
  } catch (error) {
    console.error("[API] /api/inventory error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
