import { Category } from '@interfaces';
import { CATEGORY_MAPPING, COLLECTIBLES_MAPPING, SUPPLIES_MAPPING } from '@const/categories';

export function getCategoryByRoute(routeName: string): Category | undefined {
  const allCategories = [
    ...Object.values(CATEGORY_MAPPING),
    ...Object.values(COLLECTIBLES_MAPPING),
    ...Object.values(SUPPLIES_MAPPING)
  ];
  return allCategories.find(cat => cat.routeName === routeName);
}

export function getCategoryBySquareName(squareName: string): Category | undefined {
  const allCategories = [
    ...Object.values(CATEGORY_MAPPING),
    ...Object.values(COLLECTIBLES_MAPPING),
    ...Object.values(SUPPLIES_MAPPING)
  ];
  return allCategories.find(cat => cat.squareCategory === squareName);
} 