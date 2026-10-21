import type { CSSProperties } from 'react';
import type { BrandColors, Subscription } from '../types';

/** Kantenlänge, auf die das Logo zum Auszählen verkleinert wird. */
const SAMPLE_SIZE = 40;
const LOAD_TIMEOUT_MS = 4000;
/** Satte Farben zählen bis zu (1 + x)-fach – das rote Netflix-N schlägt so den grossen schwarzen Grund. */
const SATURATION_WEIGHT = 4;
/** Ab dieser Sättigung zählt ein Pixel als bunt (sonst Graustufe). */
const CHROMATIC_SATURATION = 0.3;

interface Bucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Für getImageData nötig; Data-URLs und Brandfetch (CORS: *) erlauben das.
    image.crossOrigin = 'anonymous';
    const timer = window.setTimeout(() => reject(new Error('Logo lädt zu lange')), LOAD_TIMEOUT_MS);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Logo nicht ladbar'));
    };
    image.src = src;
  });
}

const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0');
const hex = ({ r, g, b }: { r: number; g: number; b: number }) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

const isNearWhite = (r: number, g: number, b: number) => r > 235 && g > 235 && b > 235;

/** Farbton 0–360° (nur für bunte Pixel sinnvoll). */
function hue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return 0;
  const h = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (h * 60 + 360) % 360;
}

/**
 * Gruppe eines Pixels: bunte Pixel nach Farbton (12 Bereiche à 30°), alle anderen nach Helligkeit
 * (4 Graustufen). So zählen Abstufungen einer Farbe (Schattierung, Kantenglättung) zusammen.
 */
function groupKey(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  if (saturation(r, g, b) >= CHROMATIC_SATURATION && max >= 50) return `h${Math.floor(hue(r, g, b) / 30)}`;
  return `g${Math.min(3, Math.floor(((r + g + b) / 3 / 256) * 4))}`;
}

/**
 * Dominante Primär- und Sekundärfarbe eines Logos. Ein weisser Hintergrund (Ecken weiss, z.B. aus dem
 * Zuschnitt-Editor) zählt nicht mit; satte Farben werden bevorzugt, damit z.B. das rote Netflix-N
 * gegen den schwarzen Grund gewinnt. Schwarze oder graue Logos behalten bewusst ihr Schwarz/Grau.
 */
export function getDominantColors(data: Uint8ClampedArray, size: number): BrandColors | null {
  const pixel = (x: number, y: number) => (y * size + x) * 4;
  const corners = [pixel(0, 0), pixel(size - 1, 0), pixel(0, size - 1), pixel(size - 1, size - 1)];
  const whiteBackground = corners.every(
    (i) => (data[i + 3] ?? 0) > 128 && isNearWhite(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0),
  );

  const groups = new Map<string, Bucket>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    if ((data[i + 3] ?? 0) < 128) continue; // transparent
    if (whiteBackground && isNearWhite(r, g, b)) continue;
    const key = groupKey(r, g, b);
    const group = groups.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    group.count += 1;
    group.r += r;
    group.g += g;
    group.b += b;
    groups.set(key, group);
  }
  if (groups.size === 0) return whiteBackground ? { primary: '#ffffff', secondary: '#e4e4e7' } : null;

  const average = (group: Bucket) => ({ r: group.r / group.count, g: group.g / group.count, b: group.b / group.count });
  // Bonus nur für bunte Gruppen: Fast-Schwarz wie (1, 0, 0) hätte rechnerisch volle Sättigung.
  const weight = ([key, group]: [string, Bucket]) => {
    if (!key.startsWith('h')) return group.count;
    const { r, g, b } = average(group);
    return group.count * (1 + SATURATION_WEIGHT * saturation(r, g, b));
  };
  const [first, second] = [...groups.entries()].sort((a, b) => weight(b) - weight(a)).map(([, group]) => group);
  if (!first) return null;
  return { primary: hex(average(first)), secondary: hex(average(second ?? first)) };
}

/** Lädt das Logo und bestimmt seine Markenfarben; null, wenn das Bild nicht lesbar ist. */
export async function extractBrandColors(src: string): Promise<BrandColors | null> {
  try {
    const image = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return getDominantColors(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data, SAMPLE_SIZE);
  } catch {
    return null;
  }
}

/**
 * Markenfarben beim Speichern mitgeben: unverändertes Logo behält seine Farben, ein neues wird
 * einmal ausgewertet (nicht bei jeder Anzeige), ohne Logo gibt es keine.
 */
export async function withBrandColors(sub: Subscription, previous?: Subscription): Promise<Subscription> {
  if (!sub.logoUrl) return { ...sub, brandColors: undefined };
  if (previous?.logoUrl === sub.logoUrl && previous.brandColors) return { ...sub, brandColors: previous.brandColors };
  return { ...sub, brandColors: (await extractBrandColors(sub.logoUrl)) ?? undefined };
}

/** CSS-Variablen für Glow und Akzentlinie – der einzige Inline-Style der Karte (Farbe ist dynamisch). */
export function brandColorStyle(colors: BrandColors | undefined): CSSProperties | undefined {
  if (!colors) return undefined;
  return { '--brand': colors.primary, '--brand-2': colors.secondary } as CSSProperties;
}
