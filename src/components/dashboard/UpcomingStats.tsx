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

function describeOthers({ pausedCount, inactiveCount }: CostSummary): string {
  const parts = [
    pausedCount > 0 ? `${pausedCount} pausiert` : null,
    inactiveCount > 0 ? `${inactiveCount} inaktiv` : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(' · ') : 'Alle aktiv';
}

export function UpcomingStats({ summary, nextPayment, baseCurrency, onShowAll }: UpcomingStatsProps) {
  const today = new Date();
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Aktive Abos"
        value={String(summary.activeCount)}
        icon={Layers}
        hint={describeOthers(summary)}
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
