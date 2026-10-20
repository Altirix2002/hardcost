import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChartPie, ChevronRight, Crown, Layers, Plus, Sparkles, TrendingUp } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import {
  getCategoryBreakdown,
  getMonthlySpendHistory,
  getMostExpensiveSubscription,
  getPaymentMethodBreakdown,
  getPriceHikes,
} from '../../utils/calculations';
import { formatCurrency } from '../../utils/format';
import { getWrappedSummary } from '../../utils/insights';
import { spring } from '../../utils/motion';
import { isRunning } from '../../utils/pauses';
import { StatCard } from '../dashboard/StatCard';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { GlassCard } from '../ui/GlassCard';
import { CategoryBreakdown } from './CategoryBreakdown';
import { PaymentMethodsChart } from './PaymentMethodsChart';
import { PriceHikeRadar } from './PriceHikeRadar';
import { SavingsSimulator } from './SavingsSimulator';
import { SubPulseWrapped } from './SubPulseWrapped';
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
      activeCount: subscriptions.filter((s) => isRunning(s, today)).length,
      priceHikes: getPriceHikes(subscriptions, baseCurrency, rates, today),
      paymentMethods: getPaymentMethodBreakdown(subscriptions, baseCurrency, rates, today),
      wrapped: getWrappedSummary(subscriptions, baseCurrency, rates, today),
    };
  }, [subscriptions, categories, baseCurrency, rates]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const closeWrapped = useCallback(() => setWrappedOpen(false), []);

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
      <motion.button
        type="button"
        onClick={() => setWrappedOpen(true)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        className="relative flex items-center gap-4 overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 via-indigo-500 to-violet-600 p-5 text-left text-white shadow-lg shadow-indigo-500/25 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none"
      >
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block font-semibold tracking-tight">SubPulse Wrapped</span>
          <span className="block text-sm text-white/80">Dein Abo-Jahr im Rückblick</span>
        </span>
        <ChevronRight className="relative h-5 w-5 shrink-0" aria-hidden />
      </motion.button>

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

      <Panel title="Spar-Simulator" description="Wähle Abos ab, um zu sehen, was eine Kündigung bringen würde.">
        <SavingsSimulator
          subscriptions={subscriptions}
          categoriesById={categoriesById}
          baseCurrency={baseCurrency}
          rates={rates}
        />
      </Panel>

      <Panel title="Preiserhöhungs-Radar" description="Letzte bzw. angekündigte Preiserhöhung je Abo.">
        <PriceHikeRadar hikes={stats.priceHikes} categoriesById={categoriesById} baseCurrency={baseCurrency} />
      </Panel>

      <Panel title="Nach Zahlungsart" description="Monatliche Fixkosten je Zahlungsmittel – antippen für Details.">
        {stats.paymentMethods.length > 0 ? (
          <PaymentMethodsChart shares={stats.paymentMethods} categoriesById={categoriesById} currency={baseCurrency} />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Keine aktiven Abos mit laufenden Kosten.</p>
        )}
      </Panel>

      <SubPulseWrapped
        open={wrappedOpen}
        summary={stats.wrapped}
        categoriesById={categoriesById}
        currency={baseCurrency}
        onClose={closeWrapped}
      />
    </>
  );
}
