export interface CategoryGroup {
  name: string;
  categories: Category[];
}

export interface Category {
  displayName: string;
  routeName: string;
  squareCategory: string;
} 