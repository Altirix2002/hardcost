import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Radar } from 'lucide-react';
import type { CancellationAlert, Category, Subscription } from '../../types';
import { CANCELLATION_ALERT_DAYS } from '../../utils/calculations';
import { formatDate, formatRelativeDays } from '../../utils/format';
import { sheetSpringWithFade, spring } from '../../utils/motion';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';

interface CancellationRadarProps {
  alerts: CancellationAlert[];
  categoriesById: Map<string, Category>;
  onSelect: (subscription: Subscription) => void;
}

export function CancellationRadar({ alerts, categoriesById, onSelect }: CancellationRadarProps) {
  const count = alerts.length;

  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.section
          aria-label="Kündigungsradar"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={sheetSpringWithFade}
          className="overflow-hidden"
        >
          <div className="rounded-3xl border border-amber-500/30 bg-amber-50/70 p-4 shadow-lg shadow-amber-900/5 sm:backdrop-blur-md dark:border-amber-400/20 dark:bg-amber-950/40 dark:shadow-black/30">
            <div className="flex items-center gap-3 px-1">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <span aria-hidden className="absolute inset-0 rounded-full bg-amber-500/25 motion-safe:animate-ping" />
                <Radar className="relative h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold tracking-tight text-amber-900 dark:text-amber-100">Kündigungsradar</h2>
                <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                  {count === 1 ? 'Eine Frist läuft' : `${count} Fristen laufen`} in den nächsten{' '}
                  {CANCELLATION_ALERT_DAYS} Tagen ab.
                </p>
              </div>
            </div>

            <ul className="mt-3 flex flex-col gap-2">
              {alerts.map(({ subscription, window }) => (
                <motion.li key={subscription.id} layout transition={spring}>
                  <motion.button
                    type="button"
                    onClick={() => onSelect(subscription)}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/60 p-2 pr-3 text-left transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:outline-none dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
                  >
                    <SubscriptionLogo
                      name={subscription.name}
                      logoUrl={subscription.logoUrl}
                      shape={subscription.logoShape}
                      color={categoriesById.get(subscription.categoryId)?.color}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{subscription.name}</span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        Verlängert sich am {formatDate(window.renewalDate, true)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-amber-700 dark:text-amber-300">
                        {window.daysLeft === 0 ? 'Heute' : formatRelativeDays(window.daysLeft)}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        bis {formatDate(window.deadline)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
