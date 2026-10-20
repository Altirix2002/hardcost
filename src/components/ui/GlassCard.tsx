import type { PointerEvent } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  /** Aktiviert Hover-Lift, Tap-Feedback und den Licht-Spot unter dem Mauszeiger. */
  interactive?: boolean;
}

/**
 * Licht-Spot: Die Mausposition landet als CSS-Variablen auf der Karte, ein radialer Verlauf im
 * ::before folgt ihr. Nur bei echter Maus (hover-fähig) sichtbar – auf Touch-Geräten wäre er sinnlos.
 */
const SPOTLIGHT = cn(
  'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0',
  'before:transition-opacity before:duration-300 hover:before:opacity-100',
  'before:bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.35),transparent_60%)]',
  'dark:before:bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.07),transparent_60%)]',
);

function trackPointer(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== 'mouse') return;
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
  target.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
}

export function GlassCard({ interactive = false, className, children, onPointerMove, ...rest }: GlassCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -2, scale: 1.005 } : undefined}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      transition={spring}
      onPointerMove={(event) => {
        if (interactive) trackPointer(event);
        onPointerMove?.(event);
      }}
      className={cn(
        'relative rounded-3xl border border-white/20 bg-white/70 shadow-lg shadow-zinc-900/5 sm:backdrop-blur-md',
        'dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-black/30',
        // Lichtkante: feines inneres Highlight an der Oberkante – hell kräftig, dunkel dezent.
        'inset-shadow-2xs inset-shadow-white/80 dark:inset-shadow-white/10',
        interactive && 'cursor-pointer transition-shadow duration-300 hover:shadow-xl',
        interactive && SPOTLIGHT,
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
