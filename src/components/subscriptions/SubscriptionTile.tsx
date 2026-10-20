import { AlarmClock, CalendarX, Gift, Moon, Users, type LucideIcon } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { getCancellationAlert, getCurrentInterval, getMonthlyCost, getRegularMonthlyCost } from '../../utils/calculations';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { isPausedAt } from '../../utils/pauses';
import { isActiveAt, isInTrialAt, isRunningOut } from '../../utils/status';
import { GlassCard } from '../ui/GlassCard';
import { SubscriptionLogo } from './SubscriptionLogo';

interface SubscriptionTileProps {
  subscription: Subscription;
  category?: Category;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

interface TileStatus {
  icon: LucideIcon;
  label: string;
  className: string;
}

/** Wichtigster Zustand als kleines Symbol oben rechts – Details zeigt die Listen-Ansicht. */
function getTileStatus(sub: Subscription, today: Date): TileStatus | null {
  if (getCancellationAlert(sub, today)) {
    return { icon: AlarmClock, label: 'Kündigungsfrist läuft bald ab', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
  }
  if (isActiveAt(sub, today) && isInTrialAt(sub, today)) {
    return { icon: Gift, label: 'In der Gratis-Testphase', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' };
  }
  if (isActiveAt(sub, today) && isPausedAt(sub, today)) {
    return { icon: Moon, label: 'Pausiert', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
  }
  if (isRunningOut(sub, today) || !isActiveAt(sub, today)) {
    return { icon: CalendarX, label: 'Gekündigt', className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' };
  }
  if (sub.split) {
    return { icon: Users, label: 'Geteilt – nur dein Anteil zählt', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' };
  }
  return null;
}

/** Kompakte Kachel: Logo, Name und Monatspreis – mehr Abos auf einen Blick. */
export function SubscriptionTile({ subscription, category, baseCurrency, rates, onSelect }: SubscriptionTileProps) {
  const today = new Date();
  const active = isActiveAt(subscription, today);
  const paused = active && isPausedAt(subscription, today);
  const inTrial = active && isInTrialAt(subscription, today);
  const running = active && !paused;
  const interval = getCurrentInterval(subscription, today);
  const status = getTileStatus(subscription, today);

  const isFree = active && interval !== undefined && (inTrial || interval.amount === 0);
  const showsAmount = active && interval !== undefined && !isFree;
  const monthly = paused
    ? getRegularMonthlyCost(subscription, baseCurrency, rates, today)
    : getMonthlyCost(subscription, baseCurrency, rates, today);
  const price = showsAmount ? formatCurrency(monthly, baseCurrency) : isFree ? 'Gratis' : '–';

  return (
    <GlassCard
      interactive={Boolean(onSelect)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={`${subscription.name}, ${price}${showsAmount ? ' pro Monat' : ''}${status ? `, ${status.label}` : ''}`}
      onClick={onSelect ? () => onSelect(subscription) : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onSelect(subscription);
            }
          : undefined
      }
      // Inhalt statt ganzer Karte abdunkeln: Unter 100 % Deckkraft schaltet Chrome den Glas-Blur ab.
      className={cn(
        'flex h-full flex-col items-center gap-2 px-2 pt-4 pb-3 text-center focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none',
        !running && '*:opacity-60',
      )}
    >
      {status && (
        <span
          title={status.label}
          className={cn('absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full', status.className)}
        >
          <status.icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      <SubscriptionLogo
        name={subscription.name}
        logoUrl={subscription.logoUrl}
        shape={subscription.logoShape}
        color={category?.color}
      />
      <span className="w-full min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight">{subscription.name}</span>
        <span
          className={cn(
            'block truncate text-xs tabular-nums',
            isFree ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400',
            paused && 'line-through',
          )}
        >
          {price}
          {showsAmount && '/Mt.'}
        </span>
      </span>
    </GlassCard>
  );
}
