export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  image: string;
  imageIds: string[];
  imageUrls?: string[];
  category: string;
  variations: {
    id: string;
    name: string;
    price: number;
  }[];
  stockQuantity: number;
}
