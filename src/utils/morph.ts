/**
 * Lage eines Knopfs als Morph-Ursprung – ohne die Tipp-Skalierung (whileTap), die beim Antippen
 * gerade läuft: Mitte aus dem sichtbaren Rechteck, Grösse aus der Layout-Grösse.
 */
export function measureMorphOrigin(element: HTMLElement): DOMRect {
  const rect = element.getBoundingClientRect();
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  return new DOMRect(rect.left + rect.width / 2 - width / 2, rect.top + rect.height / 2 - height / 2, width, height);
}
