import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { formatCurrency, formatPercent } from '../../utils/format';
import { getBudgetStatus, type BudgetLevel } from '../../utils/insights';
import { spring } from '../../utils/motion';

interface BudgetMeterProps {
  monthly: number;
  budget: number;
  currency: string;
}

const BAR: Record<BudgetLevel, string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  over: 'bg-rose-500',
};

const TEXT: Record<BudgetLevel, string> = {
  ok: 'text-zinc-500 dark:text-zinc-400',
  warning: 'text-amber-700 dark:text-amber-400',
  over: 'text-rose-600 dark:text-rose-400',
};

/** Fortschrittsbalken der monatlichen Fixkosten gegenüber dem selbst gesetzten Budget. */
export function BudgetMeter({ monthly, budget, currency }: BudgetMeterProps) {
  const { share, remaining, level } = getBudgetStatus(monthly, budget);

  return (
    <div className="mt-4">
      <div className="h-2 overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(share, 1) * 100}%` }}
          transition={spring}
          className={cn('h-full rounded-full transition-colors duration-500', BAR[level])}
        />
      </div>
      <p className={cn('mt-1.5 flex justify-between gap-2 text-xs font-medium tabular-nums', TEXT[level])}>
        <span>
          {formatPercent(share)} von {formatCurrency(budget, currency)} Budget
        </span>
        <span>
          {remaining >= 0
            ? `${formatCurrency(remaining, currency)} frei`
            : `${formatCurrency(-remaining, currency)} drüber`}
        </span>
      </p>
    </div>
  );
}
