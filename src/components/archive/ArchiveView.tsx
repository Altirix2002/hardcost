import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ghost, PiggyBank, RotateCcw } from 'lucide-react';
import { reactivateWithUndo } from '../../services/subscriptionActions';
import type { ArchiveEntry, Category, ExchangeRates, Subscription } from '../../types';
import { getArchiveSummary } from '../../utils/archive';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDate } from '../../utils/format';
import { collapseItemVariants, spring, swapVariants } from '../../utils/motion';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';
import { AnimatedCurrency } from '../ui/AnimatedCurrency';
import { EmptyState } from '../ui/EmptyState';
import { GlassCard } from '../ui/GlassCard';

interface ArchiveViewProps {
  subscriptions: Subscription[];
  categories: Category[];
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect: (subscription: Subscription) => void;
}

interface ArchiveCardProps {
  entry: ArchiveEntry;
  category?: Category;
  currency: string;
  onSelect: (subscription: Subscription) => void;
}

/** Grabstein eines beendeten Abos: entsättigt, mit Ersparnis seit dem Ende und Zurückholen-Knopf. */
function ArchiveCard({ entry, category, currency, onSelect }: ArchiveCardProps) {
  const { subscription, endedOn, monthly, saved } = entry;

  return (
    <GlassCard interactive onClick={() => onSelect(subscription)} className="flex items-center gap-3 p-4">
      <div className="shrink-0 grayscale">
        <SubscriptionLogo
          name={subscription.name}
          logoUrl={subscription.logoUrl}
          shape={subscription.logoShape}
          color={category?.color}
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">{subscription.name}</h3>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {endedOn ? `Beendet am ${formatDate(endedOn, true)}` : 'Beendet'} · zuletzt {formatCurrency(monthly, currency)}/Mt.
        </p>
        <p
          className={cn(
            'mt-0.5 text-sm font-semibold tabular-nums',
            saved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400',
          )}
        >
          {saved > 0 ? `${formatCurrency(saved, currency)} gespart` : endedOn ? 'Noch nichts gespart' : 'Ersparnis unbekannt'}
        </p>
      </div>
      <motion.button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void reactivateWithUndo(subscription);
        }}
        whileTap={{ scale: 0.92 }}
        transition={spring}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/70 px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:outline-none dark:border-white/10 dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Reaktivieren</span>
        <span className="sr-only sm:hidden">{subscription.name} reaktivieren</span>
      </motion.button>
    </GlassCard>
  );
}

/** Abo-Friedhof: nur wirklich beendete Abos – mit Spar-Tracker und 1-Klick-Reaktivierung. */
export function ArchiveView({ subscriptions, categories, baseCurrency, rates, onSelect }: ArchiveViewProps) {
  const summary = useMemo(
    () => getArchiveSummary(subscriptions, baseCurrency, rates, new Date()),
    [subscriptions, baseCurrency, rates],
  );
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const count = summary.entries.length;

  return (
    <AnimatePresence initial={false}>
      {count === 0 ? (
        <motion.div key="empty" variants={swapVariants} initial="hidden" animate="visible" exit="exit">
          <EmptyState
            icon={Ghost}
            title="Der Friedhof ist leer"
            description="Beendete Abos landen hier – mit der Summe, die du seit der Kündigung sparst. Ein Tipp holt sie zurück."
          />
        </motion.div>
      ) : (
        <motion.div key="list" variants={swapVariants} initial="hidden" animate="visible" exit="exit">
          <GlassCard className="relative overflow-hidden p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20"
            />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <PiggyBank className="h-4 w-4" aria-hidden />
                Seit den Kündigungen gespart
              </div>
              <AnimatedCurrency
                key={baseCurrency}
                value={summary.totalSaved}
                currency={baseCurrency}
                className="mt-3 block text-4xl font-semibold tracking-tight text-emerald-600 sm:text-5xl dark:text-emerald-400"
              />
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {count === 1 ? '1 Abo ruht hier' : `${count} Abos ruhen hier`} · zusammen{' '}
                <AnimatedCurrency key={baseCurrency} value={summary.monthlySaved} currency={baseCurrency} /> pro Monat
                weniger
              </p>
            </div>
          </GlassCard>

          <h2 className="mt-6 mb-3 px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Beendete Abos ({count})
          </h2>
          {/* Zurückgeholte Abos klappen weich zusammen (Abstand als Innenabstand, siehe collapseItemVariants). */}
          <ul className="flex flex-col [overflow-anchor:none]">
            <AnimatePresence initial={false}>
              {summary.entries.map((entry) => (
                <motion.li
                  key={entry.subscription.id}
                  layout="position"
                  variants={collapseItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={spring}
                >
                  <div className="pb-3">
                    <ArchiveCard
                      entry={entry}
                      category={categoriesById.get(entry.subscription.categoryId)}
                      currency={baseCurrency}
                      onSelect={onSelect}
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
