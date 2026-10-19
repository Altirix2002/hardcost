import { useMemo, type ReactNode } from 'react';
import { ChartPie, Crown, Layers, Plus, TrendingUp } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import {
  getCategoryBreakdown,
  getMonthlySpendHistory,
  getMostExpensiveSubscription,
} from '../../utils/calculations';
import { formatCurrency } from '../../utils/format';
import { StatCard } from '../dashboard/StatCard';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { GlassCard } from '../ui/GlassCard';
import { CategoryBreakdown } from './CategoryBreakdown';
import { SpendChart } from './SpendChart';

interface StatisticsViewProps {
  subscriptions: Subscription[];
  categories: Category[];
  baseCurrency: string;
  rates: ExchangeRates | null;
  onCreate: () => void;
}

interface PanelProps {
  title: string;
  description: string;
  children: ReactNode;
}

function Panel({ title, description, children }: PanelProps) {
  return (
    <GlassCard className="flex flex-col gap-5 p-5 sm:p-6">
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      {children}
    </GlassCard>
  );
}

export function StatisticsView({ subscriptions, categories, baseCurrency, rates, onCreate }: StatisticsViewProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const history = getMonthlySpendHistory(subscriptions, baseCurrency, rates, today);
    return {
      history,
      average: history.reduce((sum, point) => sum + point.total, 0) / Math.max(1, history.length),
      breakdown: getCategoryBreakdown(subscriptions, categories, baseCurrency, rates, today),
      top: getMostExpensiveSubscription(subscriptions, baseCurrency, rates, today),
      activeCount: subscriptions.filter((s) => s.isActive).length,
    };
  }, [subscriptions, categories, baseCurrency, rates]);

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon={ChartPie}
        title="Noch keine Statistiken"
        description="Sobald du Abos erfasst hast, siehst du hier Verlauf und Verteilung deiner Kosten."
        action={
          <Button icon={Plus} onClick={onCreate}>
            Erstes Abo erfassen
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Teuerstes Abo"
          icon={Crown}
          value={stats.top ? formatCurrency(stats.top.monthly, baseCurrency) : '–'}
          hint={stats.top ? `${stats.top.subscription.name} · pro Monat` : 'Keine aktiven Abos'}
        />
        <StatCard
          label="Ø pro Monat"
          icon={TrendingUp}
          value={formatCurrency(stats.average, baseCurrency)}
          hint="Abbuchungen der letzten 12 Monate"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Aktive Dienste"
            icon={Layers}
            value={String(stats.activeCount)}
            hint={`von ${subscriptions.length} erfassten Abos`}
          />
        </div>
      </div>

      <Panel
        title="Ausgabenverlauf"
        description="Tatsächliche Abbuchungen je Monat – jeweils mit dem damals gültigen Preis."
      >
        <SpendChart key={baseCurrency} points={stats.history} currency={baseCurrency} />
      </Panel>

      <Panel title="Fixkosten nach Kategorie" description="Monatsäquivalent aller aktiven Abos.">
        {stats.breakdown.length > 0 ? (
          <CategoryBreakdown shares={stats.breakdown} currency={baseCurrency} />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Keine aktiven Abos mit laufenden Kosten.</p>
        )}
      </Panel>
    </>
  );
}
