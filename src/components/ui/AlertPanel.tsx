import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { sheetSpringWithFade } from '../../utils/motion';

export type AlertTone = 'amber' | 'rose' | 'violet';

interface AlertPanelProps {
  open: boolean;
  tone: AlertTone;
  icon: LucideIcon;
  title: string;
  subtitle: ReactNode;
  label: string;
  children: ReactNode;
}

const TONES: Record<AlertTone, { panel: string; glow: string; badge: string; ping: string; title: string; text: string }> = {
  amber: {
    panel: 'border-amber-500/30 bg-amber-50/70 shadow-amber-900/5 dark:border-amber-400/20 dark:bg-amber-950/40',
    glow: 'bg-orange-500/25 dark:bg-rose-500/20',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    ping: 'bg-amber-500/25',
    title: 'text-amber-900 dark:text-amber-100',
    text: 'text-amber-800/80 dark:text-amber-200/70',
  },
  rose: {
    panel: 'border-rose-500/40 bg-rose-50/70 shadow-rose-900/10 dark:border-rose-400/30 dark:bg-rose-950/40',
    glow: 'bg-rose-500/30 dark:bg-rose-500/25',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    ping: 'bg-rose-500/30',
    title: 'text-rose-900 dark:text-rose-100',
    text: 'text-rose-800/80 dark:text-rose-200/70',
  },
  violet: {
    panel: 'border-violet-500/30 bg-violet-50/70 shadow-violet-900/5 dark:border-violet-400/20 dark:bg-violet-950/40',
    glow: 'bg-fuchsia-500/20 dark:bg-violet-500/20',
    badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    ping: 'bg-violet-500/25',
    title: 'text-violet-900 dark:text-violet-100',
    text: 'text-violet-800/80 dark:text-violet-200/70',
  },
};

/**
 * Warn-Kasten der Übersicht im Stil des Kündigungsradars: klappt weich auf und zu und trägt seinen
 * 24-px-Abstand selbst (Polster innen, negativer Rand aussen), damit nichts springt.
 */
export function AlertPanel({ open, tone, icon: Icon, title, subtitle, label, children }: AlertPanelProps) {
  const styles = TONES[tone];

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          aria-label={label}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={sheetSpringWithFade}
          className="-mb-6 overflow-hidden [overflow-anchor:none]"
        >
          <div className="pb-6">
            <div
              className={cn(
                'relative overflow-hidden rounded-3xl border p-4 shadow-lg inset-shadow-2xs inset-shadow-white/70 sm:backdrop-blur-md dark:shadow-black/30 dark:inset-shadow-white/10',
                styles.panel,
              )}
            >
              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute -top-20 -left-12 h-48 w-48 rounded-full blur-3xl motion-safe:animate-pulse',
                  styles.glow,
                )}
              />
              <div className="relative flex items-center gap-3 px-1">
                <span
                  className={cn('relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full', styles.badge)}
                >
                  <span aria-hidden className={cn('absolute inset-0 rounded-full motion-safe:animate-ping', styles.ping)} />
                  <Icon className="relative h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className={cn('font-semibold tracking-tight', styles.title)}>{title}</h2>
                  <p className={cn('text-xs', styles.text)}>{subtitle}</p>
                </div>
              </div>
              <ul className="relative mt-3 -mb-2 flex flex-col">{children}</ul>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
