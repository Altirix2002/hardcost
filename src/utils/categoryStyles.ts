import type { CategoryColor } from '../types';

interface CategoryColorClasses {
  solid: string;
  soft: string;
}

// Vollständige Klassennamen, damit Tailwind sie beim Build erkennt.
export const CATEGORY_COLOR_CLASSES: Record<CategoryColor, CategoryColorClasses> = {
  rose: { solid: 'bg-rose-500', soft: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  orange: { solid: 'bg-orange-500', soft: 'bg-orange-500/15 text-orange-700 dark:text-orange-300' },
  amber: { solid: 'bg-amber-500', soft: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  lime: { solid: 'bg-lime-500', soft: 'bg-lime-500/15 text-lime-700 dark:text-lime-300' },
  emerald: { solid: 'bg-emerald-500', soft: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  teal: { solid: 'bg-teal-500', soft: 'bg-teal-500/15 text-teal-700 dark:text-teal-300' },
  sky: { solid: 'bg-sky-500', soft: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  indigo: { solid: 'bg-indigo-500', soft: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' },
  violet: { solid: 'bg-violet-500', soft: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  fuchsia: { solid: 'bg-fuchsia-500', soft: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300' },
  slate: { solid: 'bg-slate-500', soft: 'bg-slate-500/15 text-slate-700 dark:text-slate-300' },
};

export const CATEGORY_COLORS = Object.keys(CATEGORY_COLOR_CLASSES) as CategoryColor[];

export const CATEGORY_COLOR_LABELS: Record<CategoryColor, string> = {
  rose: 'Rosa',
  orange: 'Orange',
  amber: 'Bernstein',
  lime: 'Limette',
  emerald: 'Smaragd',
  teal: 'Petrol',
  sky: 'Himmelblau',
  indigo: 'Indigo',
  violet: 'Violett',
  fuchsia: 'Fuchsia',
  slate: 'Schiefer',
};
