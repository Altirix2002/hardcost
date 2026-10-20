import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { getMonthlyCost } from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { formatCurrency, formatPercent } from '../../utils/format';
import { simulateSavings } from '../../utils/insights';
import { spring } from '../../utils/motion';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';
import { AnimatedCurrency } from '../ui/AnimatedCurrency';
import { Button } from '../ui/Button';

interface SavingsSimulatorProps {
  subscriptions: Subscription[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
}

const NOTHING_CANCELLED: ReadonlySet<string> = new Set();

/** "Was wäre, wenn …": Abos abwählen und die Ersparnis live sehen. */
export function SavingsSimulator({ subscriptions, categoriesById, baseCurrency, rates }: SavingsSimulatorProps) {
  const [cancelled, setCancelled] = useState<ReadonlySet<string>>(NOTHING_CANCELLED);

  const running = useMemo(() => {
    const today = new Date();
    return subscriptions
      .map((subscription) => ({ subscription, monthly: getMonthlyCost(subscription, baseCurrency, rates, today) }))
      .filter((entry) => entry.monthly > 0)
      .sort((a, b) => b.monthly - a.monthly);
  }, [subscriptions, baseCurrency, rates]);

  const result = useMemo(
    () => simulateSavings(running.map((entry) => entry.subscription), cancelled, baseCurrency, rates),
    [running, cancelled, baseCurrency, rates],
  );

  const toggle = (id: string) =>
    setCancelled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (running.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Keine laufenden Abos zum Simulieren.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={cn(INSET_PANEL, 'flex flex-col gap-4')}>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Ersparnis pro Jahr</p>
          <p className="text-3xl font-semibold tracking-tight text-emerald-600 tabular-nums dark:text-emerald-400">
            +<AnimatedCurrency key={baseCurrency} value={result.savedYearly} currency={baseCurrency} />
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          {[
            { label: 'Pro Monat', value: result.savedMonthly },
            { label: '12 Monate', value: result.savedYearly },
            { label: '3 Jahre', value: result.savedThreeYears },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
              <dd className="font-semibold tabular-nums">{formatCurrency(value, baseCurrency)}</dd>
            </div>
          ))}
        </dl>
        <div>
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Neu {formatCurrency(result.newMonthly, baseCurrency)} statt {formatCurrency(result.currentMonthly, baseCurrency)}
              /Mt.
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">−{formatPercent(result.reduction)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-500/20">
            <motion.div
              animate={{ width: `${(1 - result.reduction) * 100}%` }}
              transition={spring}
              className="h-full rounded-full bg-zinc-900 dark:bg-white"
            />
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {running.map(({ subscription, monthly }) => {
          const kept = !cancelled.has(subscription.id);
          return (
            <li key={subscription.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={kept}
                onClick={() => toggle(subscription.id)}
                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-zinc-900/5 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none dark:hover:bg-white/5"
              >
                <motion.span
                  animate={{ scale: kept ? 1 : 0.9 }}
                  transition={spring}
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                    kept ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600',
                  )}
                >
                  {kept && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
                </motion.span>
                <span className={cn('flex min-w-0 flex-1 items-center gap-3 transition-opacity', !kept && 'opacity-50')}>
                  <SubscriptionLogo
                    name={subscription.name}
                    logoUrl={subscription.logoUrl}
                    shape={subscription.logoShape}
                    color={categoriesById.get(subscription.categoryId)?.color}
                    size="sm"
                  />
                  <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', !kept && 'line-through')}>
                    {subscription.name}
                  </span>
                  <span className="shrink-0 text-sm text-zinc-500 tabular-nums dark:text-zinc-400">
                    {formatCurrency(monthly, baseCurrency)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {cancelled.size > 0 && (
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setCancelled(NOTHING_CANCELLED)} className="self-start">
          Alle wieder auswählen
        </Button>
      )}
    </div>
  );
}
