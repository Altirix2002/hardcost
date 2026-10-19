import { CalendarRange, Layers, Wallet } from 'lucide-react';
import type { ExchangeRates, Subscription } from '../../types';
import { getTotalMonthlyCost } from '../../utils/calculations';
import { formatCurrency } from '../../utils/format';
import { StatCard } from './StatCard';

interface SummaryGridProps {
  subscriptions: Subscription[];
  baseCurrency: string;
  rates: ExchangeRates | null;
}

export function SummaryGrid({ subscriptions, baseCurrency, rates }: SummaryGridProps) {
  const monthly = getTotalMonthlyCost(subscriptions, baseCurrency, rates);
  const activeCount = subscriptions.filter((s) => s.isActive).length;
  const ratesHint = rates ? `Kurse vom ${rates.date}` : 'Ohne Wechselkurse';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard label="Pro Monat" value={formatCurrency(monthly, baseCurrency)} icon={Wallet} hint={ratesHint} />
      <StatCard label="Pro Jahr" value={formatCurrency(monthly * 12, baseCurrency)} icon={CalendarRange} />
      <div className="col-span-2 sm:col-span-1">
        <StatCard
          label="Aktive Abos"
          value={String(activeCount)}
          icon={Layers}
          hint={`${subscriptions.length - activeCount} inaktiv`}
        />
      </div>
    </div>
  );
}
