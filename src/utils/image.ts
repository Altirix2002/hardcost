/** Kantenlänge der gespeicherten Logos in Pixeln. */
const LOGO_SIZE = 256;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'));
    image.src = src;
  });
}

/**
 * Skaliert ein hochgeladenes Bild quadratisch (contain, transparenter Rand)
 * und liefert es als kompakte Data-URL für die lokale Speicherung in IndexedDB.
 */
export async function imageFileToDataUrl(file: File, size: number = LOGO_SIZE): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Bitte eine Bilddatei wählen (PNG, JPG, SVG oder WebP).');

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const width = image.naturalWidth || size;
    const height = image.naturalHeight || size;
    const scale = Math.min(size / width, size / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Bildverarbeitung wird von diesem Browser nicht unterstützt.');

    context.imageSmoothingQuality = 'high';
    context.drawImage(image, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);
    // Browser ohne WebP-Encoder fallen automatisch auf PNG zurück.
    return canvas.toDataURL('image/webp', 0.9);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
