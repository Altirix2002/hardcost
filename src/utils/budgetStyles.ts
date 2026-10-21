import type { CategoryBudgetLevel } from '../types';

/** Schriftfarben der Kategorie-Budget-Ampel (die Kugel selbst färbt LiquidGauge). */
export const CATEGORY_BUDGET_TEXT: Record<CategoryBudgetLevel, string> = {
  ok: 'text-zinc-500 dark:text-zinc-400',
  notice: 'text-yellow-700 dark:text-yellow-300',
  warning: 'text-orange-700 dark:text-orange-300',
  over: 'text-rose-600 dark:text-rose-400',
};
