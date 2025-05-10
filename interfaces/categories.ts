export interface SquareCategory {
  displayName: string;
  slug: string;
  squareCategoryId: string;
}

export interface CategoryGroup {
  name: string;
  categories: SquareCategory[];
}