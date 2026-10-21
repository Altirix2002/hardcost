import type { CategoryColor, CategoryHue, CategoryTone } from '../types';

interface CategoryColorClasses {
  /** Vollfläche, z.B. Farbpunkte, Balken, Initialen-Hintergrund. */
  solid: string;
  /** Gut lesbare Schriftfarbe auf `solid`. */
  onSolid: string;
  /** Getönte Fläche mit passender Schrift, z.B. Badges und gewählte Chips. */
  soft: string;
}

export const CATEGORY_HUES: CategoryHue[] = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'stone',
];

export const CATEGORY_TONES: CategoryTone[] = ['light', 'base', 'dark'];

export const CATEGORY_HUE_LABELS: Record<CategoryHue, string> = {
  red: 'Rot',
  orange: 'Orange',
  amber: 'Bernstein',
  yellow: 'Gelb',
  lime: 'Limette',
  green: 'Grün',
  emerald: 'Smaragd',
  teal: 'Petrol',
  cyan: 'Cyan',
  sky: 'Himmelblau',
  blue: 'Blau',
  indigo: 'Indigo',
  violet: 'Violett',
  purple: 'Lila',
  fuchsia: 'Fuchsia',
  pink: 'Pink',
  rose: 'Rosa',
  slate: 'Schiefer',
  stone: 'Stein',
};

export const CATEGORY_TONE_LABELS: Record<CategoryTone, string> = {
  light: 'Hell',
  base: 'Normal',
  dark: 'Dunkel',
};

/** Helle Farbtöne, auf denen weisse Schrift schlecht lesbar ist. */
const BRIGHT_HUES = new Set<CategoryHue>(['amber', 'yellow', 'lime']);

// Die Klassen werden aus Farbton und Stufe zusammengesetzt. Damit Tailwind sie trotzdem erzeugt,
// sind alle Kombinationen in index.css per `@source inline(...)` freigegeben – bei Änderungen dort
// mitpflegen.
const TONE_CLASSES: Record<CategoryTone, (hue: CategoryHue) => CategoryColorClasses> = {
  light: (hue) => ({
    solid: `bg-${hue}-400`,
    onSolid: 'text-zinc-900/80',
    soft: `bg-${hue}-400/20 text-${hue}-700 dark:text-${hue}-200`,
  }),
  base: (hue) => ({
    solid: `bg-${hue}-500`,
    onSolid: BRIGHT_HUES.has(hue) ? 'text-zinc-900/80' : 'text-white',
    soft: `bg-${hue}-500/15 text-${hue}-700 dark:text-${hue}-300`,
  }),
  dark: (hue) => ({
    solid: `bg-${hue}-700`,
    onSolid: 'text-white',
    soft: `bg-${hue}-700/20 text-${hue}-800 dark:text-${hue}-300`,
  }),
};

const TONE_SHADE: Record<CategoryTone, number> = { light: 400, base: 500, dark: 700 };

/** Farbe des Initialen-Logos (`solid`) als CSS-Wert – z.B. für die eingefärbte Abo-Karte ohne Logo. */
export function getCategoryColorValue(color: CategoryColor): string {
  const { hue, tone } = parseCategoryColor(color);
  return `var(--color-${hue}-${TONE_SHADE[tone]})`;
}

export function toCategoryColor(hue: CategoryHue, tone: CategoryTone): CategoryColor {
  return tone === 'base' ? hue : `${hue}-${tone}`;
}

export function parseCategoryColor(color: CategoryColor): { hue: CategoryHue; tone: CategoryTone } {
  const [hue, tone] = color.split('-') as [CategoryHue, CategoryTone | undefined];
  return { hue, tone: tone ?? 'base' };
}

export const CATEGORY_COLORS: CategoryColor[] = CATEGORY_HUES.flatMap((hue) =>
  CATEGORY_TONES.map((tone) => toCategoryColor(hue, tone)),
);

export function isCategoryColor(value: unknown): value is CategoryColor {
  return CATEGORY_COLORS.some((color) => color === value);
}

const CLASS_CACHE = new Map<CategoryColor, CategoryColorClasses>(
  CATEGORY_COLORS.map((color) => {
    const { hue, tone } = parseCategoryColor(color);
    return [color, TONE_CLASSES[tone](hue)];
  }),
);

const FALLBACK_CLASSES = TONE_CLASSES.base('slate');

/** Fällt bei unbekannten Werten (z.B. aus alten Backups) auf Schiefergrau zurück. */
export function getCategoryColorClasses(color: CategoryColor): CategoryColorClasses {
  return CLASS_CACHE.get(color) ?? FALLBACK_CLASSES;
}

export function getCategoryColorLabel(color: CategoryColor): string {
  const { hue, tone } = parseCategoryColor(color);
  const label = CATEGORY_HUE_LABELS[hue] ?? 'Farbe';
  return tone === 'base' ? label : `${label} (${CATEGORY_TONE_LABELS[tone]})`;
}
