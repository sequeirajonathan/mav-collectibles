export interface SquareItem {
  id: string;
  itemData?: {
    name?: string | null;
    description?: string | null;
    variations?: Array<{
      id?: string;
      itemVariationData?: {
        name?: string | null;
        priceMoney?: { amount?: bigint | null };
        sku?: string | null;
        stockable?: boolean | null;
        sellable?: boolean | null;
      };
    }> | null;
    imageIds?: string[] | null;
    categories?: Array<{
      id?: string;
      ordinal?: bigint | null;
    }> | null;
    ecom_available?: boolean;
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
  categoryType: string;
  stockQuantity: number;
  variations: {
    id: string;
    name: string;
    price: number;
    sku?: string | null;
    stockable: boolean;
    sellable: boolean;
  }[];
}
  