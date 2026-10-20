import { AlarmClock, CalendarClock, Lock, Moon, PauseCircle, Users } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import {
  getActiveCommitmentEnd,
  getCancellationAlert,
  getCurrentInterval,
  getMonthlyCost,
  getNextChargeDate,
  getPausedMonthlySavings,
} from '../../utils/calculations';
import { addDays, daysBetween } from '../../utils/dates';
import { BILLING_CYCLE_SUFFIX, formatCurrency, formatDate, formatRelativeDays } from '../../utils/format';
import { cn } from '../../utils/cn';
import { getResumeDate, isPausedAt } from '../../utils/pauses';
import { isZombie } from '../../utils/review';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { SubscriptionLogo } from './SubscriptionLogo';
import { ZombieHint } from './ZombieHint';

interface SubscriptionCardProps {
  subscription: Subscription;
  category?: Category;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

export function SubscriptionCard({ subscription, category, baseCurrency, rates, onSelect }: SubscriptionCardProps) {
  const today = new Date();
  const { isActive, billingCycle, split } = subscription;
  const isPaused = isActive && isPausedAt(subscription, today);
  const isRunning = isActive && !isPaused;
  const interval = getCurrentInterval(subscription, today);
  const monthly = isPaused
    ? getPausedMonthlySavings(subscription, baseCurrency, rates, today)
    : getMonthlyCost(subscription, baseCurrency, rates, today);
  const nextBilling = getNextChargeDate(subscription, today);
  const resumeDate = isPaused ? getResumeDate(subscription, today) : null;
  const alert = getCancellationAlert(subscription, today);
  const commitmentEnd = isActive ? getActiveCommitmentEnd(subscription, today) : null;
  const zombie = isZombie(subscription, today);
  const showOriginalPrice =
    interval !== undefined && (split !== undefined || interval.currency !== baseCurrency || billingCycle !== 'monthly');

  return (
    <GlassCard
      interactive={Boolean(onSelect)}
      onClick={onSelect ? () => onSelect(subscription) : undefined}
      // Inhalt statt ganzer Karte abdunkeln: Unter 100 % Deckkraft schaltet Chrome den Glas-Blur ab.
      className={cn('flex h-full flex-col gap-4 p-4', !isRunning && '*:opacity-60')}
    >
      <div className="flex items-start gap-3">
        <SubscriptionLogo
          name={subscription.name}
          logoUrl={subscription.logoUrl}
          shape={subscription.logoShape}
          color={category?.color}
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate font-semibold tracking-tight">{subscription.name}</h3>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {subscription.planName ?? subscription.paymentMethod}
          </p>
        </div>
        {category && (
          <div className="shrink-0">
            <Badge color={category.color}>{category.name}</Badge>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <div className="min-w-0">
          {isActive && interval ? (
            <p
              className={cn(
                'text-xl font-semibold tracking-tight tabular-nums',
                isPaused && 'text-zinc-400 line-through decoration-2 dark:text-zinc-500',
              )}
            >
              {formatCurrency(monthly, baseCurrency)}
              <span className="ml-0.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">/Mt.</span>
            </p>
          ) : (
            <p className="text-xl font-semibold text-zinc-400">–</p>
          )}
          {interval && showOriginalPrice && (
            <p className="flex items-center gap-1 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
              {split && <Users className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />}
              <span className="truncate">
                {split && 'Dein Anteil von '}
                {formatCurrency(interval.amount, interval.currency)}
                {BILLING_CYCLE_SUFFIX[billingCycle]}
              </span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
          {isRunning && nextBilling ? (
            <>
              <p className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                {formatDate(nextBilling)}
              </p>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatRelativeDays(daysBetween(today, nextBilling))}
              </p>
            </>
          ) : isPaused ? (
            <>
              <p className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                <Moon className="h-3.5 w-3.5" aria-hidden />
                Pausiert
              </p>
              <p>{resumeDate ? `bis ${formatDate(addDays(resumeDate, -1))}` : 'unbefristet'}</p>
            </>
          ) : (
            <p className="inline-flex items-center gap-1">
              <PauseCircle className="h-3.5 w-3.5" aria-hidden />
              Inaktiv
            </p>
          )}
        </div>
      </div>

      {(alert || commitmentEnd) && (
        <div className="-mt-1 flex flex-wrap gap-2">
          {alert && (
            <Badge color="amber" icon={AlarmClock}>
              Kündigen bis {formatDate(alert.deadline)}
            </Badge>
          )}
          {commitmentEnd && (
            <Badge color="indigo" icon={Lock}>
              Mindestlaufzeit bis {formatDate(commitmentEnd, true)}
            </Badge>
          )}
        </div>
      )}
      {zombie && (
        <div className="-mt-1">
          <ZombieHint subscription={subscription} />
        </div>
      )}
    </GlassCard>
  );
}
