export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  availability?: "IN_STOCK" | "SOLD_OUT";
  stockQuantity: number;
  image: string;
  imageIds: string[];
  imageUrls?: string[];
  category: string;
  variations: {
    id: string;
    name: string;
    price: number;
  }[];
}
