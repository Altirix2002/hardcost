import type { LogoCrop, LogoSource } from '../types';

/** Kantenlänge der gespeicherten Logos in Pixeln. */
export const LOGO_SIZE = 256;

/** Grössere Uploads werden vor dem Bearbeiten auf diese Kantenlänge verkleinert. */
const EDITABLE_MAX_SIZE = 1024;

export const LOGO_ZOOM_MIN = 0.2;
export const LOGO_ZOOM_MAX = 4;

export const WHITE = '#ffffff';
export const BLACK = '#000000';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Web-Bilder anonym laden, sonst ist das Canvas danach für den Export gesperrt.
    if (/^https?:/.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Das Bild konnte nicht geladen werden.'));
    image.src = src;
  });
}

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Bildverarbeitung wird von diesem Browser nicht unterstützt.');
  context.imageSmoothingQuality = 'high';
  return [canvas, context];
}

function imageSize(image: HTMLImageElement): { width: number; height: number } {
  // SVGs ohne feste Grösse melden teils 0 – dann quadratisch annehmen.
  return { width: image.naturalWidth || LOGO_SIZE, height: image.naturalHeight || LOGO_SIZE };
}

/** Liest eine gewählte Bilddatei ein und verkleinert sie auf eine handliche Arbeitsgrösse (PNG, mit Transparenz). */
export async function fileToEditableDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Bitte eine Bilddatei wählen (PNG, JPG, SVG oder WebP).');

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const { width, height } = imageSize(image);
    const scale = Math.min(1, EDITABLE_MAX_SIZE / Math.max(width, height));
    const [canvas, context] = createCanvas(width * scale, height * scale);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Wahrgenommene Helligkeit 0–1 einer Hex-Farbe (#rrggbb). */
function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isLightColor(hex: string): boolean {
  return luminance(hex) > 0.75;
}

/**
 * Farbe der Bildecken – passt als Hintergrund, wenn das Bild kleiner gezoomt wird.
 * Transparente Ecken ergeben Weiss.
 */
export function detectEdgeColor(image: HTMLImageElement): string {
  const size = 16;
  const [, context] = createCanvas(size, size);
  context.drawImage(image, 0, 0, size, size);
  const corners = [
    [0, 0],
    [size - 1, 0],
    [0, size - 1],
    [size - 1, size - 1],
  ].map(([x, y]) => context.getImageData(x ?? 0, y ?? 0, 1, 1).data);

  if (corners.some((pixel) => (pixel[3] ?? 0) < 128)) return WHITE;
  const average = (channel: number) => corners.reduce((sum, pixel) => sum + (pixel[channel] ?? 0), 0) / corners.length;
  return toHex(average(0), average(1), average(2));
}

/** Startzuschnitt: Marken-Icons mit Rand, quadratische Bilder füllend, breite Logos vollständig sichtbar. */
export function getInitialCrop(image: HTMLImageElement, source: LogoSource): LogoCrop {
  if (source.monochrome) {
    const brand = source.brandColor ?? BLACK;
    return { zoom: 0.6, offsetX: 0, offsetY: 0, background: isLightColor(brand) ? BLACK : brand };
  }
  const { width, height } = imageSize(image);
  const ratio = Math.max(width, height) / Math.min(width, height);
  return { zoom: ratio <= 1.3 ? ratio : 1, offsetX: 0, offsetY: 0, background: detectEdgeColor(image) };
}

/** Einfarbige Icons: Originalfarbe auf Weiss, sonst Weiss bzw. Schwarz – je nachdem, was besser lesbar ist. */
function glyphColor(background: string): string | null {
  if (background.toLowerCase() === WHITE) return null;
  return isLightColor(background) ? BLACK : WHITE;
}

/** Zeichnet das zugeschnittene Logo quadratisch in `context` (Kantenlänge `size`). */
export function drawLogo(
  context: CanvasRenderingContext2D,
  size: number,
  image: HTMLImageElement,
  crop: LogoCrop,
  monochrome = false,
): void {
  const { width, height } = imageSize(image);
  const scale = Math.min(size / width, size / height) * crop.zoom;
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const x = (size - drawWidth) / 2 + crop.offsetX * size;
  const y = (size - drawHeight) / 2 + crop.offsetY * size;

  context.clearRect(0, 0, size, size);
  context.fillStyle = crop.background;
  context.fillRect(0, 0, size, size);

  const tint = monochrome ? glyphColor(crop.background) : null;
  if (!tint) {
    context.drawImage(image, x, y, drawWidth, drawHeight);
    return;
  }
  // Glyphe separat einfärben: nur die deckenden Pixel übernehmen die neue Farbe.
  const [glyph, glyphContext] = createCanvas(drawWidth, drawHeight);
  glyphContext.drawImage(image, 0, 0, glyph.width, glyph.height);
  glyphContext.globalCompositeOperation = 'source-in';
  glyphContext.fillStyle = tint;
  glyphContext.fillRect(0, 0, glyph.width, glyph.height);
  context.drawImage(glyph, x, y, drawWidth, drawHeight);
}

/** Rendert den Zuschnitt als kompakte Data-URL für die lokale Speicherung in IndexedDB. */
export function exportLogo(image: HTMLImageElement, crop: LogoCrop, monochrome = false): string {
  const [canvas, context] = createCanvas(LOGO_SIZE, LOGO_SIZE);
  drawLogo(context, LOGO_SIZE, image, crop, monochrome);
  // Browser ohne WebP-Encoder fallen automatisch auf PNG zurück.
  return canvas.toDataURL('image/webp', 0.9);
}
