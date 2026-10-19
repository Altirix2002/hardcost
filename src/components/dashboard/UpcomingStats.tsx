import { CalendarClock, Layers } from 'lucide-react';
import type { CostSummary, UpcomingPayment } from '../../types';
import { daysBetween } from '../../utils/dates';
import { formatCurrency, formatDate, formatRelativeDays } from '../../utils/format';
import { StatCard } from './StatCard';

interface UpcomingStatsProps {
  summary: CostSummary;
  nextPayment?: UpcomingPayment;
  baseCurrency: string;
  onShowAll: () => void;
}

export function UpcomingStats({ summary, nextPayment, baseCurrency, onShowAll }: UpcomingStatsProps) {
  const today = new Date();
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Aktive Abos"
        value={String(summary.activeCount)}
        icon={Layers}
        hint={summary.inactiveCount > 0 ? `${summary.inactiveCount} inaktiv` : 'Alle aktiv'}
      />
      <StatCard
        label="Nächste Abbuchung"
        value={nextPayment ? formatCurrency(nextPayment.amount, baseCurrency) : '–'}
        icon={CalendarClock}
        onClick={onShowAll}
        hint={
          nextPayment
            ? `${nextPayment.subscription.name} · ${formatDate(nextPayment.date)} (${formatRelativeDays(daysBetween(today, nextPayment.date))})`
            : 'Keine anstehend'
        }
      />
    </div>
  );
}
