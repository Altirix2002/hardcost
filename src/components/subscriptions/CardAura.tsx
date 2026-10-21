import type { BrandColors } from '../../types';

interface CardAuraProps {
  brandColors?: BrandColors;
  /** Ruhemodus (pausiert): langsam atmende, monochrome Randhelligkeit statt Markenfarbe. */
  sleeping?: boolean;
}

/**
 * Lichteffekte einer Abo-Karte, als eigene Ebenen in der Glaskarte:
 * - Marken-Glow: weicher Schatten in der Logofarbe rund um die Karte
 * - Akzentlinie: feiner Verlauf Primär → Sekundär an der Oberkante
 * - Atem-Glow: pausierte Abos pulsieren langsam (nur Deckkraft – GPU-schonend)
 * Die Farben kommen als CSS-Variablen (--brand, --brand-2) vom Kartencontainer.
 */
export function CardAura({ brandColors, sleeping = false }: CardAuraProps) {
  if (sleeping) {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-slate-400/70 shadow-[0_0_22px_2px_rgba(148,163,184,0.45)] motion-safe:animate-breathe dark:ring-white/30 dark:shadow-[0_0_24px_2px_rgba(226,232,240,0.18)]"
      />
    );
  }
  if (!brandColors) return null;
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[0_14px_34px_-16px_color-mix(in_srgb,var(--brand)_75%,transparent)] transition-shadow duration-500"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--brand),var(--brand-2),transparent)] opacity-80"
      />
    </>
  );
}
