import { motion } from 'framer-motion';
import type { CategoryShare } from '../../types';
import { toWholePercents } from '../../utils/calculations';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { formatCurrency, formatPercent } from '../../utils/format';
import { spring } from '../../utils/motion';

interface CategoryBreakdownProps {
  shares: CategoryShare[];
  currency: string;
}

/** Gestapelter Gesamtbalken plus beschriftete Einzelbalken – Identität nie nur über Farbe. */
export function CategoryBreakdown({ shares, currency }: CategoryBreakdownProps) {
  // Ganze Prozente, die zusammen exakt 100 ergeben.
  const percents = toWholePercents(shares.map((entry) => entry.share));

  return (
    <div className="flex flex-col gap-6">
      <div aria-hidden className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {shares.map((entry, index) => (
          <motion.div
            key={entry.category.id}
            title={`${entry.category.name}: ${formatPercent(entry.share)}`}
            initial={{ width: 0 }}
            animate={{ width: `${entry.share * 100}%` }}
            transition={{ ...spring, delay: index * 0.05 }}
            className={cn('h-full min-w-1', getCategoryColorClasses(entry.category.color).solid)}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-4">
        {shares.map((entry, index) => (
          <li key={entry.category.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getCategoryColorClasses(entry.category.color).solid)}
                />
                <span className="truncate font-medium">{entry.category.name}</span>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.count === 1 ? '1 Abo' : `${entry.count} Abos`}
                </span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                <span className="font-medium">{formatCurrency(entry.monthly, currency)}</span>
                <span className="w-10 text-right text-xs text-zinc-500 dark:text-zinc-400">
                  {formatPercent((percents[index] ?? 0) / 100)}
                </span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900/5 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${entry.share * 100}%` }}
                transition={{ ...spring, delay: 0.1 + index * 0.05 }}
                className={cn('h-full rounded-full', getCategoryColorClasses(entry.category.color).solid)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
