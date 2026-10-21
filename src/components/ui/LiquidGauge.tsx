import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../../utils/cn';
import { formatPercent } from '../../utils/format';
import { softSpring } from '../../utils/motion';

export type LiquidTone = 'ok' | 'notice' | 'warning' | 'over';

interface LiquidGaugeProps {
  /** Auslastung 0–∞ (1 = Budget genau ausgeschöpft). */
  share: number;
  tone: LiquidTone;
  size?: 'sm' | 'md';
  label: string;
}

/** Flüssigkeitsfarbe je Ampelstufe; der Wechsel gleitet über transition-colors. */
const TONE_TEXT: Record<LiquidTone, string> = {
  ok: 'text-emerald-500',
  notice: 'text-yellow-400',
  warning: 'text-orange-500',
  over: 'text-rose-500',
};

/** Wellenzug über 100 Einheiten (Periode 50); doppelt gezeichnet und um die halbe Breite verschoben ergibt das einen nahtlosen Lauf. */
const WAVE_PATH = 'M0 6 Q12.5 0 25 6 T50 6 T75 6 T100 6 V12 H0 Z';

/**
 * Liquid-Fill: runde Glas-Kugel, deren Flüssigkeit auf die Auslastung steigt. Der Pegel gleitet per
 * translateY, die zwei gegenläufigen Wellen per translateX – beides nur Compositing (GPU), kein Layout.
 * Über 100 % ist die Kugel randvoll und die Wellen laufen schneller. Ausserhalb des Bildschirms pausiert die Animation.
 */
export function LiquidGauge({ share, tone, size = 'md', label }: LiquidGaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: '80px' });
  const level = Math.min(Math.max(share, 0), 1);
  const over = share > 1;
  // Pegel als Verschiebung: 0 % = ganz unten (plus Wellenhöhe), 100 % = Wellenkamm knapp über dem Rand.
  const offset = `${(1 - level) * 100 + (level === 0 ? 12 : 0)}%`;
  const paused = !visible && '[animation-play-state:paused]';

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${label}: ${formatPercent(share)}`}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-white/40 bg-zinc-900/5 shadow-inner inset-shadow-xs inset-shadow-zinc-900/10 transition-colors duration-700 dark:border-white/10 dark:bg-white/5',
        size === 'sm' ? 'h-11 w-11' : 'h-14 w-14',
        TONE_TEXT[tone],
        over && 'shadow-[0_0_18px_-2px_currentColor]',
      )}
    >
      <motion.div
        aria-hidden
        initial={{ y: '100%' }}
        animate={{ y: offset }}
        transition={softSpring}
        // Transparenz auf der ganzen Flüssigkeit, nicht auf Welle und Körper einzeln – sonst ein dunkler Saum.
        className="absolute inset-0 opacity-85"
      >
        {/* Hintere, langsamere Welle – halbtransparent für Tiefe. */}
        <svg
          viewBox="0 0 200 12"
          preserveAspectRatio="none"
          className={cn(
            'absolute -top-2 left-0 h-3 w-[200%] fill-current opacity-40 motion-safe:animate-[wave_3.2s_linear_infinite_reverse]',
            paused,
          )}
        >
          <path d={WAVE_PATH} />
          <path d={WAVE_PATH} transform="translate(100 0)" />
        </svg>
        <svg
          viewBox="0 0 200 12"
          preserveAspectRatio="none"
          className={cn(
            'absolute -top-1.5 left-0 h-3 w-[200%] fill-current',
            over ? 'motion-safe:animate-[wave_1.1s_linear_infinite]' : 'motion-safe:animate-[wave_2.2s_linear_infinite]',
            paused,
          )}
        >
          <path d={WAVE_PATH} />
          <path d={WAVE_PATH} transform="translate(100 0)" />
        </svg>
        <div className="absolute inset-0 top-1 bg-current" />
      </motion.div>
      {/* Glanzlicht oben links: wirkt wie gewölbtes Glas. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 left-2 h-2.5 w-4 rounded-full bg-white/50 blur-[1px] dark:bg-white/25"
      />
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-semibold text-zinc-900 tabular-nums dark:text-white',
          size === 'sm' ? 'text-[11px]' : 'text-xs',
        )}
      >
        {formatPercent(share)}
      </span>
    </div>
  );
}
