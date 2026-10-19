// Erzeugt die PNG-Icons für Manifest und iOS aus den SVG-Vorlagen in /public.
// Aufruf: npm run icons  (die Ergebnisse werden eingecheckt, der Build braucht sharp nicht)
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));

const ICONS = [
  // Abgerundetes Icon mit transparenten Ecken (Desktop-Installation, Favicon-Fallback)
  { source: 'icon.svg', output: 'pwa-64x64.png', size: 64 },
  { source: 'icon.svg', output: 'pwa-192x192.png', size: 192 },
  { source: 'icon.svg', output: 'pwa-512x512.png', size: 512 },
  // Randlos: Android maskiert, iOS rundet selbst ab
  { source: 'icon-maskable.svg', output: 'maskable-icon-512x512.png', size: 512 },
  { source: 'icon-maskable.svg', output: 'apple-touch-icon-180x180.png', size: 180 },
];

for (const { source, output, size } of ICONS) {
  await sharp(publicDir + source, { density: 384 }).resize(size, size).png().toFile(publicDir + output);
  console.log(`✓ ${output}`);
}
