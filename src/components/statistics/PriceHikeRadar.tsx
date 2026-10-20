import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Percent, TrendingUp } from 'lucide-react';
import type { Category, PriceHike, PriceHikeSortKey } from '../../types';
import { sortPriceHikes } from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { parseISODate } from '../../utils/dates';
import { BILLING_CYCLE_SUFFIX, formatCurrency, formatDate, formatPercent, formatSignedCurrency } from '../../utils/format';
import { spring } from '../../utils/motion';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';
import { SegmentedControl } from '../ui/SegmentedControl';

interface PriceHikeRadarProps {
  hikes: PriceHike[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
}

const SORT_OPTIONS = [
  { value: 'absolute' as const, label: 'Mehrkosten', icon: TrendingUp },
  { value: 'percent' as const, label: 'Prozent', icon: Percent },
];

/** Letzte bzw. angekündigte Preiserhöhung je Abo. */
export function PriceHikeRadar({ hikes, categoriesById, baseCurrency }: PriceHikeRadarProps) {
  const [sortKey, setSortKey] = useState<PriceHikeSortKey>('absolute');
  const sorted = useMemo(() => sortPriceHikes(hikes, sortKey), [hikes, sortKey]);
  const totalMonthly = hikes.reduce((sum, hike) => sum + hike.monthlyIncrease, 0);

  if (hikes.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Keine Preiserhöhungen erfasst. Ändert sich ein Preis, trage ihn im Abo unter «Preisverlauf» als
        Preisänderung ein – die bisherigen Monate bleiben dabei korrekt.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Zusammen{' '}
          <span className="font-semibold text-rose-600 tabular-nums dark:text-rose-400">
            {formatSignedCurrency(totalMonthly, baseCurrency)}
          </span>{' '}
          pro Monat
        </p>
        <SegmentedControl
          options={SORT_OPTIONS}
          value={sortKey}
          onChange={setSortKey}
          layoutId="price-hike-sort"
          ariaLabel="Preiserhöhungen sortieren nach"
          iconOnly
        />
      </div>

      <ul className="flex flex-col gap-2">
        {sorted.map((hike) => {
          const { subscription } = hike;
          const suffix = BILLING_CYCLE_SUFFIX[subscription.billingCycle];
          const date = formatDate(parseISODate(hike.effectiveDate), true);
          return (
            <motion.li
              key={subscription.id}
              layout
              transition={spring}
              className="flex items-center gap-3 rounded-2xl bg-white/50 p-2 pr-3 dark:bg-zinc-800/40"
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
                <span className="block truncate text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  {formatCurrency(hike.previousAmount, hike.currency)} → {formatCurrency(hike.currentAmount, hike.currency)}
                  {suffix}
                </span>
                <span
                  className={cn(
                    'block truncate text-xs',
                    hike.isUpcoming ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400',
                  )}
                >
                  {hike.isUpcoming ? `Angekündigt ab ${date}` : `Seit ${date}`}
                </span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="block text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {formatSignedCurrency(hike.absoluteChange, hike.currency)}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  +{formatPercent(hike.percentageChange, 1)}
                </span>
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
