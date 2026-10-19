import type { Category } from '../types';

/** Standardkategorien zuerst, eigene danach – jeweils alphabetisch. */
export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort(
    (a, b) => Number(a.isCustom) - Number(b.isCustom) || a.name.localeCompare(b.name, 'de-CH'),
  );
}
