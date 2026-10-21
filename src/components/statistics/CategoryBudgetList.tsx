import type { CategoryBudgetStatus } from '../../types';
import { CATEGORY_BUDGET_TEXT } from '../../utils/budgetStyles';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { LiquidGauge } from '../ui/LiquidGauge';

interface CategoryBudgetListProps {
  budgets: CategoryBudgetStatus[];
  currency: string;
}

/** Auslastung aller Kategorie-Limits als Liquid-Fill-Kugeln, höchste zuerst. */
export function CategoryBudgetList({ budgets, currency }: CategoryBudgetListProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {budgets.map(({ category, budget, monthly, share, level }) => (
        <li key={category.id} className="flex items-center gap-3">
          <LiquidGauge share={share} tone={level} size="sm" label={`Budget ${category.name}`} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <span
                aria-hidden
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getCategoryColorClasses(category.color).solid)}
              />
              <span className="truncate">{category.name}</span>
            </p>
            <p className={cn('text-xs tabular-nums', CATEGORY_BUDGET_TEXT[level])}>
              {formatCurrency(monthly, currency)} von {formatCurrency(budget, currency)}
              {level === 'over' && ` · ${formatCurrency(monthly - budget, currency)} drüber`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
