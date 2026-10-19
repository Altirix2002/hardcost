import { useMemo } from 'react';
import { Plus, SearchX, Sparkles } from 'lucide-react';
import { loadDemoSubscriptions } from '../../db/repository';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { Category, ExchangeRates, Subscription } from '../../types';
import {
  getCancellationAlerts,
  getCostSummary,
  getSpendForMonth,
  getUpcomingPayments,
} from '../../utils/calculations';
import { formatMonthName } from '../../utils/format';
import { filterSubscriptions, sortSubscriptions } from '../../utils/subscriptionList';
import { SubscriptionList } from '../subscriptions/SubscriptionList';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CancellationRadar } from './CancellationRadar';
import { CostHero } from './CostHero';
import { SubscriptionToolbar } from './SubscriptionToolbar';
import { UpcomingStats } from './UpcomingStats';

interface DashboardProps {
  subscriptions: Subscription[];
  categories: Category[];
  baseCurrency: string;
  rates: ExchangeRates | null;
  onCreate: () => void;
  onSelect: (subscription: Subscription) => void;
}

export function Dashboard({ subscriptions, categories, baseCurrency, rates, onCreate, onSelect }: DashboardProps) {
  const sortKey = useDashboardStore((s) => s.sortKey);
  const statusFilter = useDashboardStore((s) => s.statusFilter);
  const setSortKey = useDashboardStore((s) => s.setSortKey);
  const setStatusFilter = useDashboardStore((s) => s.setStatusFilter);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const overview = useMemo(() => {
    const today = new Date();
    return {
      summary: getCostSummary(subscriptions, baseCurrency, rates, today),
      alerts: getCancellationAlerts(subscriptions, today),
      nextPayment: getUpcomingPayments(subscriptions, baseCurrency, rates, today, 1)[0],
      monthSpend: getSpendForMonth(subscriptions, today.getFullYear(), today.getMonth(), baseCurrency, rates),
      monthName: formatMonthName(today),
    };
  }, [subscriptions, baseCurrency, rates]);

  const visible = useMemo(
    () => sortSubscriptions(filterSubscriptions(subscriptions, statusFilter), sortKey, baseCurrency, rates),
    [subscriptions, statusFilter, sortKey, baseCurrency, rates],
  );

  return (
    <>
      <CostHero
        summary={overview.summary}
        baseCurrency={baseCurrency}
        rates={rates}
        monthSpend={overview.monthSpend}
        monthName={overview.monthName}
      />
      <UpcomingStats summary={overview.summary} nextPayment={overview.nextPayment} baseCurrency={baseCurrency} />
      <CancellationRadar alerts={overview.alerts} categoriesById={categoriesById} onSelect={onSelect} />

      <section className="flex flex-col gap-3">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Noch keine Abos erfasst"
            description="Alle Daten bleiben lokal auf deinem Gerät. Erfasse dein erstes Abo oder lade Beispiele zum Ausprobieren."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button icon={Plus} onClick={onCreate}>
                  Erstes Abo erfassen
                </Button>
                <Button variant="secondary" onClick={() => void loadDemoSubscriptions()}>
                  Beispiele laden
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <SubscriptionToolbar
              count={visible.length}
              sortKey={sortKey}
              onSortChange={setSortKey}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            {visible.length > 0 ? (
              <SubscriptionList
                subscriptions={visible}
                categoriesById={categoriesById}
                baseCurrency={baseCurrency}
                rates={rates}
                onSelect={onSelect}
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Keine Abos in dieser Ansicht"
                description="Wähle oben einen anderen Filter, um alle Abos zu sehen."
              />
            )}
          </>
        )}
      </section>
    </>
  );
}
