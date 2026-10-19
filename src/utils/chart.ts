/** Rundet auf eine "schöne" Schrittweite (1, 2, 2.5, 5 × 10^n). */
function niceStep(raw: number): number {
  const exponent = Math.floor(Math.log10(raw));
  const magnitude = 10 ** exponent;
  const fraction = raw / magnitude;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * magnitude;
}

/** Y-Achsen-Ticks von 0 bis knapp über `max` mit runden Werten. */
export function getNiceTicks(max: number, segments = 3): number[] {
  if (max <= 0) return [0];
  const step = niceStep(max / segments);
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
