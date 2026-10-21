import { AnimatePresence, motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import type { CategoryBudgetStatus } from '../../types';
import { CATEGORY_BUDGET_TEXT } from '../../utils/budgetStyles';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { collapseItemVariants, spring } from '../../utils/motion';
import { AlertPanel } from '../ui/AlertPanel';
import { LiquidGauge } from '../ui/LiquidGauge';

interface CategoryBudgetAlertProps {
  budgets: CategoryBudgetStatus[];
  currency: string;
}

/** Kategorien ab 80 % ihres Limits; ist eines überschritten, wird der Kasten zum harten roten Alarm. */
export function CategoryBudgetAlert({ budgets, currency }: CategoryBudgetAlertProps) {
  const critical = budgets.filter((budget) => budget.level !== 'ok');
  const overCount = critical.filter((budget) => budget.level === 'over').length;

  return (
    <AlertPanel
      open={critical.length > 0}
      tone={overCount > 0 ? 'rose' : 'amber'}
      icon={Gauge}
      label="Kategorie-Budgets"
      title={overCount > 0 ? 'Budget überschritten' : 'Budget wird knapp'}
      subtitle={
        overCount > 0
          ? `${overCount === 1 ? 'Eine Kategorie liegt' : `${overCount} Kategorien liegen`} über dem Limit.`
          : `${critical.length === 1 ? 'Eine Kategorie nähert' : `${critical.length} Kategorien nähern`} sich dem Limit.`
      }
    >
      <AnimatePresence initial={false}>
        {critical.map(({ category, budget, monthly, share, level }) => (
          <motion.li
            key={category.id}
            layout="position"
            variants={collapseItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={spring}
          >
            <div className="pb-2">
              <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-2 pr-3 dark:bg-zinc-900/50">
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
                    {formatCurrency(monthly, currency)} von {formatCurrency(budget, currency)} pro Monat
                    {level === 'over' && ` · ${formatCurrency(monthly - budget, currency)} drüber`}
                  </p>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </AlertPanel>
  );
}
