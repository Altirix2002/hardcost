import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CalendarDays, ChevronRight, List } from 'lucide-react';
import type { Category, ExchangeRates, Subscription, UpcomingRange } from '../../types';
import { getUpcomingCharges, groupChargesByMonth } from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { daysBetween } from '../../utils/dates';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { formatCurrency, formatMonthYear, formatRelativeDays, formatWeekdayDate } from '../../utils/format';
import { springWithFade } from '../../utils/motion';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';
import { ChargeCalendar } from './ChargeCalendar';

interface UpcomingPaymentsModalProps {
  open: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  categories: Category[];
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect: (subscription: Subscription) => void;
}

const RANGE_DAYS: Record<UpcomingRange, number> = { month: 30, quarter: 90, year: 365 };

const RANGE_OPTIONS = [
  { value: 'month' as const, label: '30 Tage' },
  { value: 'quarter' as const, label: '3 Monate' },
  { value: 'year' as const, label: '12 Monate' },
];

type UpcomingView = 'list' | 'calendar';

const VIEW_OPTIONS = [
  { value: 'list' as const, label: 'Liste', icon: List },
  { value: 'calendar' as const, label: 'Kalender', icon: CalendarDays },
];

const RANGE_LABELS: Record<UpcomingRange, string> = {
  month: 'in den nächsten 30 Tagen',
  quarter: 'in den nächsten 3 Monaten',
  year: 'in den nächsten 12 Monaten',
};

/** Alle anstehenden Abbuchungen, nach Monat gruppiert. */
export function UpcomingPaymentsModal({
  open,
  onClose,
  subscriptions,
  categories,
  baseCurrency,
  rates,
  onSelect,
}: UpcomingPaymentsModalProps) {
  const [range, setRange] = useState<UpcomingRange>('month');
  const [view, setView] = useState<UpcomingView>('list');
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { today, charges, months, total } = useMemo(() => {
    const now = new Date();
    const upcoming = getUpcomingCharges(subscriptions, baseCurrency, rates, now, RANGE_DAYS[range]);
    return {
      today: now,
      charges: upcoming,
      months: groupChargesByMonth(upcoming),
      total: upcoming.reduce((sum, charge) => sum + charge.amount, 0),
    };
  }, [subscriptions, baseCurrency, rates, range]);

  return (
    <Modal open={open} onClose={onClose} title="Abbuchungen">
      <div className="flex flex-col gap-6">
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
          layoutId="upcoming-view"
          ariaLabel="Ansicht"
        />
        {view === 'calendar' ? (
          <ChargeCalendar
            subscriptions={subscriptions}
            categoriesById={categoriesById}
            baseCurrency={baseCurrency}
            rates={rates}
            onSelect={onSelect}
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <SegmentedControl
                options={RANGE_OPTIONS}
                value={range}
                onChange={setRange}
                layoutId="upcoming-range"
                ariaLabel="Zeitraum"
              />
              <div className={cn(INSET_PANEL, 'flex items-end justify-between gap-3')}>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Total {RANGE_LABELS[range]}</p>
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(total, baseCurrency)}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                  {charges.length === 1 ? '1 Abbuchung' : `${charges.length} Abbuchungen`}
                </p>
              </div>
            </div>

            {months.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                <CalendarCheck className="h-8 w-8 text-zinc-400" aria-hidden />
                Keine Abbuchungen in diesem Zeitraum.
              </div>
            ) : (
              months.map((group) => (
                <motion.section
                  key={`${range}-${group.year}-${group.month}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springWithFade}
                  aria-label={formatMonthYear(group.year, group.month)}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-baseline justify-between gap-3 px-1">
                    <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                      {formatMonthYear(group.year, group.month)}
                    </h3>
                    <span className="text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
                      {formatCurrency(group.total, baseCurrency)}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {group.charges.map((charge) => {
                      const { subscription } = charge;
                      const days = daysBetween(today, charge.date);
                      return (
                        <li key={`${subscription.id}-${charge.date.getTime()}`}>
                          <motion.button
                            type="button"
                            onClick={() => onSelect(subscription)}
                            whileTap={{ scale: 0.98 }}
                            className="flex w-full items-center gap-3 rounded-2xl bg-white/60 p-2 pr-3 text-left transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80"
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
                                {formatWeekdayDate(charge.date)} · {formatRelativeDays(days)}
                              </span>
                            </span>
                            <span className="shrink-0 text-right tabular-nums">
                              <span className="block text-sm font-semibold">
                                {formatCurrency(charge.amount, baseCurrency)}
                              </span>
                              {charge.currency !== baseCurrency && (
                                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                                  {formatCurrency(charge.originalAmount, charge.currency)}
                                </span>
                              )}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                          </motion.button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.section>
              ))
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
