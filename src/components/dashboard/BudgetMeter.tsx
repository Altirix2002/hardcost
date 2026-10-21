import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { getBudgetStatus, type BudgetLevel } from '../../utils/insights';
import { LiquidGauge } from '../ui/LiquidGauge';

interface BudgetMeterProps {
  monthly: number;
  budget: number;
  currency: string;
}

const TEXT: Record<BudgetLevel, string> = {
  ok: 'text-zinc-500 dark:text-zinc-400',
  warning: 'text-orange-700 dark:text-orange-300',
  over: 'text-rose-600 dark:text-rose-400',
};

/** Monatliche Fixkosten gegenüber dem selbst gesetzten Budget – als Liquid-Fill-Kugel. */
export function BudgetMeter({ monthly, budget, currency }: BudgetMeterProps) {
  const { share, remaining, level } = getBudgetStatus(monthly, budget);

  return (
    <div className="mt-4 flex items-center gap-3">
      <LiquidGauge share={share} tone={level} label="Monatsbudget ausgeschöpft" />
      <div className={cn('min-w-0 text-xs font-medium tabular-nums transition-colors duration-500', TEXT[level])}>
        <p className="truncate">von {formatCurrency(budget, currency)} Budget</p>
        <p className="truncate text-sm font-semibold">
          {remaining >= 0
            ? `${formatCurrency(remaining, currency)} frei`
            : `${formatCurrency(-remaining, currency)} drüber`}
        </p>
      </div>
    </div>
  );
}
