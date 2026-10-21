import { AnimatePresence, motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import type { CategoryBudgetStatus } from '../../types';
import { CATEGORY_BUDGET_BAR, CATEGORY_BUDGET_TEXT } from '../../utils/budgetStyles';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { formatCurrency, formatPercent } from '../../utils/format';
import { collapseItemVariants, spring } from '../../utils/motion';
import { AlertPanel } from '../ui/AlertPanel';

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
              <div className="rounded-2xl bg-white/60 p-3 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getCategoryColorClasses(category.color).solid)}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                  <span className={cn('shrink-0 font-semibold tabular-nums', CATEGORY_BUDGET_TEXT[level])}>
                    {formatPercent(share)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(share, 1) * 100}%` }}
                    transition={spring}
                    className={cn('h-full rounded-full transition-colors duration-500', CATEGORY_BUDGET_BAR[level])}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  {formatCurrency(monthly, currency)} von {formatCurrency(budget, currency)} pro Monat
                  {level === 'over' && ` · ${formatCurrency(monthly - budget, currency)} drüber`}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </AlertPanel>
  );
}
