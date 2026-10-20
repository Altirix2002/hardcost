/**
 * Kurzer Vibrationsimpuls als taktiles Feedback (Android/Chrome).
 * iOS-Safari unterstützt die Vibration API nicht – dort passiert einfach nichts.
 */
export function triggerHaptic(pattern: number | number[] = 8): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vom Browser blockiert (z.B. ohne vorherige Nutzerinteraktion) – ignorieren.
  }
}
