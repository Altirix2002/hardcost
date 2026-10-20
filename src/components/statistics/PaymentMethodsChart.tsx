import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Category, CategoryColor, PaymentMethodShare } from '../../types';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { formatCurrency, formatPercent } from '../../utils/format';
import { spring } from '../../utils/motion';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';
import { Collapse } from '../ui/Collapse';

interface PaymentMethodsChartProps {
  shares: PaymentMethodShare[];
  categoriesById: Map<string, Category>;
  currency: string;
}

/** Feste Farbfolge für Zahlungsarten (unabhängig von Kategorien). */
const METHOD_COLORS: CategoryColor[] = ['sky', 'violet', 'emerald', 'amber', 'rose', 'teal', 'indigo', 'orange'];

const colorAt = (index: number): CategoryColor => METHOD_COLORS[index % METHOD_COLORS.length] ?? 'slate';

/** Verteilung der Fixkosten auf Zahlungsarten; ein Tipp zeigt die zugehörigen Abos. */
export function PaymentMethodsChart({ shares, categoriesById, currency }: PaymentMethodsChartProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div aria-hidden className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {shares.map((entry, index) => (
          <motion.div
            key={entry.method}
            initial={{ width: 0 }}
            animate={{ width: `${entry.share * 100}%` }}
            transition={{ ...spring, delay: index * 0.05 }}
            className={cn(
              'h-full min-w-1 transition-opacity',
              getCategoryColorClasses(colorAt(index)).solid,
              expanded !== null && expanded !== entry.method && 'opacity-30',
            )}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-1">
        {shares.map((entry, index) => {
          const open = expanded === entry.method;
          const count = entry.subscriptions.length;
          return (
            <li key={entry.method}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setExpanded(open ? null : entry.method)}
                className="flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left text-sm transition-colors hover:bg-zinc-900/5 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none dark:hover:bg-white/5"
              >
                <span
                  aria-hidden
                  className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getCategoryColorClasses(colorAt(index)).solid)}
                />
                <span className="min-w-0 truncate font-medium">{entry.method}</span>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {count === 1 ? '1 Abo' : `${count} Abos`}
                </span>
                <span className="ml-auto flex shrink-0 items-baseline gap-2 tabular-nums">
                  <span className="font-medium">{formatCurrency(entry.monthly, currency)}</span>
                  <span className="w-10 text-right text-xs text-zinc-500 dark:text-zinc-400">
                    {formatPercent(entry.percent / 100)}
                  </span>
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="shrink-0">
                  <ChevronDown className="h-4 w-4 text-zinc-400" aria-hidden />
                </motion.span>
              </button>
              <Collapse open={open}>
                <ul className="flex flex-col gap-2 pb-2 pl-6">
                  {entry.subscriptions.map(({ subscription, monthly }) => (
                    <li key={subscription.id} className="flex items-center gap-3 text-sm">
                      <SubscriptionLogo
                        name={subscription.name}
                        logoUrl={subscription.logoUrl}
                        shape={subscription.logoShape}
                        color={categoriesById.get(subscription.categoryId)?.color}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate">{subscription.name}</span>
                      <span className="shrink-0 text-zinc-500 tabular-nums dark:text-zinc-400">
                        {formatCurrency(monthly, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Collapse>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
