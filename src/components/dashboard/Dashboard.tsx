import { useMemo } from 'react';
import type { Category, ExchangeRates, Subscription, UserSettings } from '../../types';
import { getCancellationAlerts, getCostSummary, getSpendForMonth, getUpcomingPayments } from '../../utils/calculations';
import { formatMonthName } from '../../utils/format';
import { DEFAULT_COST_RATIO_THRESHOLDS, getCategoryBudgets, getCostRatio } from '../../utils/insights';
import { getPaymentCardAlerts } from '../../utils/paymentCards';
import { BackupReminder } from './BackupReminder';
import { CancellationRadar } from './CancellationRadar';
import { CategoryBudgetAlert } from './CategoryBudgetAlert';
import { CostHero } from './CostHero';
import { PaymentCardRadar } from './PaymentCardRadar';
import { SubscriptionsSection } from './SubscriptionsSection';
import { UpcomingStats } from './UpcomingStats';

interface DashboardProps {
  subscriptions: Subscription[];
  categories: Category[];
  baseCurrency: string;
  rates: ExchangeRates | null;
  settings: UserSettings;
  onOpenBackup: () => void;
  onOpenSettings: () => void;
  onCreate: () => void;
  onSelect: (subscription: Subscription) => void;
  onShowUpcoming: () => void;
}

export function Dashboard({
  subscriptions,
  categories,
  baseCurrency,
  rates,
  settings,
  onOpenBackup,
  onOpenSettings,
  onCreate,
  onSelect,
  onShowUpcoming,
}: DashboardProps) {
  const { monthlyBudget, lastBackupAt, paymentCards, netIncome } = settings;
  const thresholds = settings.costRatioThresholds ?? DEFAULT_COST_RATIO_THRESHOLDS;
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const overview = useMemo(() => {
    const today = new Date();
    const summary = getCostSummary(subscriptions, baseCurrency, rates, today);
    return {
      summary,
      costRatio: getCostRatio(summary.monthly, netIncome, thresholds),
      cardAlerts: getPaymentCardAlerts(subscriptions, paymentCards, today),
      categoryBudgets: getCategoryBudgets(subscriptions, categories, baseCurrency, rates, today),
      alerts: getCancellationAlerts(subscriptions, today),
      nextPayment: getUpcomingPayments(subscriptions, baseCurrency, rates, today, 1)[0],
      monthSpend: getSpendForMonth(subscriptions, today.getFullYear(), today.getMonth(), baseCurrency, rates),
      monthName: formatMonthName(today),
    };
  }, [subscriptions, categories, baseCurrency, rates, netIncome, thresholds, paymentCards]);

  return (
    <>
      <CostHero
        summary={overview.summary}
        baseCurrency={baseCurrency}
        rates={rates}
        monthSpend={overview.monthSpend}
        monthName={overview.monthName}
        alert={overview.alerts.length > 0}
        monthlyBudget={monthlyBudget}
        costRatio={overview.costRatio}
        costRatioThresholds={thresholds}
      />
      <UpcomingStats
        summary={overview.summary}
        nextPayment={overview.nextPayment}
        baseCurrency={baseCurrency}
        onShowAll={onShowUpcoming}
      />
      <CancellationRadar alerts={overview.alerts} categoriesById={categoriesById} onSelect={onSelect} />
      <PaymentCardRadar alerts={overview.cardAlerts} onOpenCards={onOpenSettings} onSelect={onSelect} />
      <CategoryBudgetAlert budgets={overview.categoryBudgets} currency={baseCurrency} />
      <BackupReminder lastBackupAt={lastBackupAt} subscriptionCount={subscriptions.length} onBackup={onOpenBackup} />

      <SubscriptionsSection
        subscriptions={subscriptions}
        categoriesById={categoriesById}
        baseCurrency={baseCurrency}
        rates={rates}
        onCreate={onCreate}
        onSelect={onSelect}
      />
    </>
  );
}
