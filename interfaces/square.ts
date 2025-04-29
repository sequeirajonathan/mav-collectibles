export interface SquareItem {
  id: string;
  itemData?: {
    name?: string;
    description?: string;
    variations?: Array<{
      id: string;
      itemVariationData?: {
        name?: string;
        priceMoney?: { amount: bigint };
        sku?: string;
      };
    }>;
    imageIds?: string[];
    categories?: Array<{
      id: string;
      ordinal?: number;
    }>;
  };
}

export interface SquareImage {
  id: string;
  type: string;
  imageData: {
    name?: string;
    url?: string;
  };
}

export interface SquareProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  imageIds: string[];
  imageUrls?: string[];
  category: string;
  variations: {
    id: string;
    name: string;
    price: number;
    sku?: string;
  }[];
}
  