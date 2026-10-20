import { useMemo } from 'react';
import { History, Moon } from 'lucide-react';
import type { ExchangeRates, Subscription } from '../../../types';
import { getLifetimeCost } from '../../../utils/calculations';
import { cn } from '../../../utils/cn';
import { INSET_PANEL } from '../../../utils/fieldStyles';
import { formatCurrency, formatMonthYear } from '../../../utils/format';

interface LifetimeCostPanelProps {
  subscription: Subscription;
  baseCurrency: string;
  rates: ExchangeRates | null;
}

/** "Bisher insgesamt bezahlt" – Summe aller echten Abbuchungen seit Vertragsbeginn. */
export function LifetimeCostPanel({ subscription, baseCurrency, rates }: LifetimeCostPanelProps) {
  const lifetime = useMemo(
    () => getLifetimeCost(subscription, baseCurrency, rates),
    [subscription, baseCurrency, rates],
  );
  const hasForeignCurrency = subscription.intervals.some((i) => i.currency !== baseCurrency);

  if (lifetime.chargeCount === 0 && lifetime.skippedCharges === 0) return null;

  return (
    <div className={cn(INSET_PANEL, 'flex flex-col gap-1')}>
      <p className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        <History className="h-4 w-4" aria-hidden />
        Bisher insgesamt bezahlt
      </p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {formatCurrency(lifetime.totalPaid, baseCurrency)}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        seit {formatMonthYear(lifetime.since.getFullYear(), lifetime.since.getMonth())} ·{' '}
        {lifetime.chargeCount === 1 ? '1 Abbuchung' : `${lifetime.chargeCount} Abbuchungen`}
        {subscription.split && ' · dein Anteil'}
        {hasForeignCurrency && ' · zu aktuellen Kursen'}
      </p>
      {lifetime.pausedDays > 0 && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {lifetime.pausedDays} {lifetime.pausedDays === 1 ? 'Tag' : 'Tage'} pausiert
          {lifetime.skippedCharges > 0 && ` · ${formatCurrency(lifetime.savedByPauses, baseCurrency)} gespart`}
        </p>
      )}
    </div>
  );
}
