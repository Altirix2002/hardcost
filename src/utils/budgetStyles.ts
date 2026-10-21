import type { CategoryBudgetLevel } from '../types';

/** Farben der Kategorie-Budget-Ampel (Balken bzw. Prozentangabe). */
export const CATEGORY_BUDGET_BAR: Record<CategoryBudgetLevel, string> = {
  ok: 'bg-emerald-500',
  notice: 'bg-yellow-400',
  warning: 'bg-orange-500',
  over: 'bg-rose-500',
};

export const CATEGORY_BUDGET_TEXT: Record<CategoryBudgetLevel, string> = {
  ok: 'text-zinc-500 dark:text-zinc-400',
  notice: 'text-yellow-700 dark:text-yellow-300',
  warning: 'text-orange-700 dark:text-orange-300',
  over: 'text-rose-600 dark:text-rose-400',
};
