import { NextResponse, NextRequest } from 'next/server';
import { createSquareClient } from '@lib/square';
import { SquareItem } from '@interfaces/square';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function convertBigIntToNumber(obj: unknown): JsonValue {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
  if (typeof obj === 'object') {
    const converted: { [key: string]: JsonValue } = {};
    for (const key in obj as object) {
      converted[key] = convertBigIntToNumber((obj as { [key: string]: unknown })[key]);
    }
    return converted;
  }
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ category: string; id: string }> }
) {
  const { id } = await context.params;

  try {
    const squareClient = createSquareClient();
    const response = await squareClient.catalog.object.get({
      objectId: id,
      includeRelatedObjects: true,
    });

    if (!response.object || response.object.type !== 'ITEM') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const item = response.object as SquareItem;

    const imageMap: Record<string, string> = {};
    response.relatedObjects?.forEach(obj => {
      if (obj.type === 'IMAGE' && obj.id && obj.imageData?.url) {
        imageMap[obj.id] = obj.imageData.url;
      }
    });

    const imageUrls = item.itemData?.imageIds?.map(id => imageMap[id]).filter(Boolean) || [];

    const serializedItem = convertBigIntToNumber({
      ...item,
      imageUrls,
    });

    return NextResponse.json({ product: serializedItem });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
