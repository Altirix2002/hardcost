import { motion } from 'framer-motion';
import type { CategoryBudgetStatus } from '../../types';
import { CATEGORY_BUDGET_BAR, CATEGORY_BUDGET_TEXT } from '../../utils/budgetStyles';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { formatCurrency, formatPercent } from '../../utils/format';
import { spring } from '../../utils/motion';

interface CategoryBudgetListProps {
  budgets: CategoryBudgetStatus[];
  currency: string;
}

/** Auslastung aller Kategorie-Limits, höchste zuerst. */
export function CategoryBudgetList({ budgets, currency }: CategoryBudgetListProps) {
  return (
    <ul className="flex flex-col gap-4">
      {budgets.map(({ category, budget, monthly, share, level }) => (
        <li key={category.id}>
          <div className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getCategoryColorClasses(category.color).solid)}
            />
            <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
            <span className="shrink-0 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
              {formatCurrency(monthly, currency)} / {formatCurrency(budget, currency)}
            </span>
            <span className={cn('w-12 shrink-0 text-right font-semibold tabular-nums', CATEGORY_BUDGET_TEXT[level])}>
              {formatPercent(share)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(share, 1) * 100}%` }}
              transition={spring}
              className={cn('h-full rounded-full transition-colors duration-500', CATEGORY_BUDGET_BAR[level])}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
