// Erzeugt Favicon und PNG-Icons für Manifest und iOS aus dem Logo app-icon.png (1024×1024).
// Aufruf: npm run icons  (die Ergebnisse werden eingecheckt, der Build braucht sharp nicht)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../app-icon.png', import.meta.url));
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));

// Das Logo bringt eine eigene abgerundete Kachel mit hellem Rand (~6 px) und
// dunklen Ecken ausserhalb mit. Die Masse gelten für die 1024er-Vorlage.
const SIZE = 1024;
const RIM_INSET = 8;
const CORNER_RADIUS = 222;
// Innenquadrat, das vollständig auf der Kachel liegt (ohne Rand und Ecken).
const BLEED_INSET = 80;
// Das Logo reicht bis knapp an die sichere Zone maskierbarer Icons – etwas verkleinern.
const BLEED_LOGO_SCALE = 0.88;

/** Abgerundete Kachel mit transparenten Ecken, heller Rand abgeschnitten. */
async function roundedTile() {
  const inner = SIZE - 2 * RIM_INSET;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}">` +
      `<rect width="${inner}" height="${inner}" rx="${CORNER_RADIUS}" fill="#fff"/></svg>`,
  );
  return sharp(source)
    .extract({ left: RIM_INSET, top: RIM_INSET, width: inner, height: inner })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * Randlose Kachel für Android (maskable) und iOS, die selbst abrunden: Ecken und Rand
 * werden durch fortgesetzten Hintergrund ersetzt. Der Hintergrund ist ein vertikaler
 * Verlauf, deshalb reicht es, die Randpixel nach aussen zu kopieren. Das verkleinerte
 * Logo liegt so in der sicheren Zone (Kreis mit 40 % Radius).
 */
async function fullBleedTile() {
  const inner = SIZE - 2 * BLEED_INSET;
  const scaled = Math.round(inner * BLEED_LOGO_SCALE);
  const padding = (SIZE - scaled) / 2;
  const cropped = await sharp(source)
    .extract({ left: BLEED_INSET, top: BLEED_INSET, width: inner, height: inner })
    .resize(scaled, scaled, { kernel: 'lanczos3' })
    .toBuffer();
  return sharp(cropped)
    .extend({
      top: Math.floor(padding),
      bottom: Math.ceil(padding),
      left: Math.floor(padding),
      right: Math.ceil(padding),
      extendWith: 'copy',
    })
    .png()
    .toBuffer();
}

/** ICO-Datei mit eingebetteten PNGs (von allen aktuellen Browsern unterstützt). */
function toIco(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map(({ data }) => data)]);
}

const resize = (tile, size) => sharp(tile).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 });

const rounded = await roundedTile();
const fullBleed = await fullBleedTile();

const ICONS = [
  // Abgerundetes Icon mit transparenten Ecken (Desktop-Installation, Favicon)
  { tile: rounded, output: 'pwa-64x64.png', size: 64 },
  { tile: rounded, output: 'pwa-192x192.png', size: 192 },
  { tile: rounded, output: 'pwa-512x512.png', size: 512 },
  // Randlos: Android maskiert, iOS rundet selbst ab
  { tile: fullBleed, output: 'maskable-icon-512x512.png', size: 512 },
  { tile: fullBleed, output: 'apple-touch-icon-180x180.png', size: 180 },
];

for (const { tile, output, size } of ICONS) {
  await resize(tile, size).toFile(publicDir + output);
  console.log(`✓ ${output}`);
}

const favicon = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, data: await resize(rounded, size).toBuffer() })),
);
await writeFile(publicDir + 'favicon.ico', toIco(favicon));
console.log('✓ favicon.ico');
