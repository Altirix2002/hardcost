import { CalendarClock, Layers } from 'lucide-react';
import type { CostSummary, UpcomingPayment } from '../../types';
import { daysBetween } from '../../utils/dates';
import { formatCurrency, formatDate, formatRelativeDays } from '../../utils/format';
import { RollingValue } from '../ui/RollingValue';
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
    inactiveCount > 0 ? `${inactiveCount} beendet` : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(' · ') : 'Alle aktiv';
}

/**
 * Anzahl und nächste Abbuchung rollen bei Änderungen wie eine Anzeigetafel. Gezählt wird hier bewusst
 * nicht: Wird das nächste Abo gelöscht, ist der neue Betrag der eines anderen Abos – Zwischenwerte
 * wie 9.91, 9.92 … gehörten zu keinem.
 */
export function UpcomingStats({ summary, nextPayment, baseCurrency, onShowAll }: UpcomingStatsProps) {
  const today = new Date();
  const others = describeOthers(summary);
  const nextKey = nextPayment
    ? `${nextPayment.subscription.id}-${nextPayment.date.getTime()}-${nextPayment.amount}-${baseCurrency}`
    : 'none';
  const nextHint = nextPayment
    ? `${nextPayment.subscription.name} · ${formatDate(nextPayment.date)} (${formatRelativeDays(daysBetween(today, nextPayment.date))})`
    : 'Keine anstehend';

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        reserveHintLines
        label="Aktive Abos"
        value={
          <RollingValue rollKey={summary.activeCount} numeric={summary.activeCount}>
            {summary.activeCount}
          </RollingValue>
        }
        icon={Layers}
        hint={<RollingValue rollKey={others}>{others}</RollingValue>}
      />
      <StatCard
        reserveHintLines
        label="Nächste Abbuchung"
        value={
          <RollingValue rollKey={nextKey}>
            {nextPayment ? formatCurrency(nextPayment.amount, baseCurrency) : '–'}
          </RollingValue>
        }
        icon={CalendarClock}
        onClick={onShowAll}
        hint={<RollingValue rollKey={nextKey}>{nextHint}</RollingValue>}
      />
    </div>
  );
}
