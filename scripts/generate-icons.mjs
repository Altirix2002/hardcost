// Erzeugt Favicon und PNG-Icons für Manifest und iOS aus dem Logo app-icon.png (1024×1024).
// Aufruf: npm run icons  (die Ergebnisse werden eingecheckt, der Build braucht sharp nicht)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../app-icon.png', import.meta.url));
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));

// Die Vorlage ist randlos schwarz, das HC-Logo liegt etwa bei x 201–822, y 276–747
// und damit bereits in der sicheren Zone maskierbarer Icons (Kreis mit 40 % Radius).
const SIZE = 1024;
const BACKGROUND = '#000000';
// Für die abgerundete Kachel (Desktop, Favicon) etwas näher heran, damit das Logo
// auch in 16–64 px noch erkennbar bleibt.
const TILE_INSET = 130;
const CORNER_RATIO = 0.225;

/** Randlose Vorlage ohne Transparenz (Android maskiert, iOS rundet selbst ab). */
function fullBleedTile() {
  return sharp(source).flatten({ background: BACKGROUND }).png().toBuffer();
}

/** Abgerundete Kachel mit transparenten Ecken, Logo leicht vergrössert. */
async function roundedTile() {
  const inner = SIZE - 2 * TILE_INSET;
  const radius = Math.round(SIZE * CORNER_RATIO);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
      `<rect width="${SIZE}" height="${SIZE}" rx="${radius}" fill="#fff"/></svg>`,
  );
  const zoomed = await sharp(source)
    .flatten({ background: BACKGROUND })
    .extract({ left: TILE_INSET, top: TILE_INSET, width: inner, height: inner })
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .toBuffer();
  return sharp(zoomed).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
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
  // Abgerundetes Icon mit transparenten Ecken (Desktop-Installation, Favicon, Header)
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
