import { AlarmClock, CalendarClock, PauseCircle } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import {
  getCancellationDeadline,
  getCurrentInterval,
  getMonthlyCost,
  getNextBillingDate,
} from '../../utils/calculations';
import { daysBetween } from '../../utils/dates';
import { BILLING_CYCLE_SUFFIX, formatCurrency, formatDate, formatRelativeDays } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { SubscriptionLogo } from './SubscriptionLogo';

/** Ab wie vielen Tagen vor Fristende ein Kündigungshinweis erscheint. */
const DEADLINE_WARNING_DAYS = 14;

interface SubscriptionCardProps {
  subscription: Subscription;
  category?: Category;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

export function SubscriptionCard({ subscription, category, baseCurrency, rates, onSelect }: SubscriptionCardProps) {
  const today = new Date();
  const interval = getCurrentInterval(subscription, today);
  const nextBilling = getNextBillingDate(subscription, today);
  const daysToDeadline = daysBetween(today, getCancellationDeadline(subscription, today));
  const showDeadline =
    subscription.isActive &&
    subscription.cancellationNoticeDays > 0 &&
    daysToDeadline >= 0 &&
    daysToDeadline <= DEADLINE_WARNING_DAYS;
  const showMonthlyEquivalent =
    subscription.isActive &&
    interval !== undefined &&
    (interval.currency !== baseCurrency || subscription.billingCycle !== 'monthly');

  return (
    <GlassCard
      interactive={Boolean(onSelect)}
      onClick={onSelect ? () => onSelect(subscription) : undefined}
      className={cn('flex items-center gap-4 p-4', !subscription.isActive && 'opacity-60')}
    >
      <SubscriptionLogo
        name={subscription.name}
        logoUrl={subscription.logoUrl}
        shape={subscription.logoShape}
        color={category?.color}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate font-semibold tracking-tight">{subscription.name}</h3>
          {subscription.planName && (
            <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">{subscription.planName}</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {category && <Badge color={category.color}>{category.name}</Badge>}
          {subscription.isActive ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              {formatDate(nextBilling)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <PauseCircle className="h-3.5 w-3.5" aria-hidden />
              Inaktiv
            </span>
          )}
          {showDeadline && (
            <Badge color="amber" icon={AlarmClock}>
              Kündigen {formatRelativeDays(daysToDeadline)}
            </Badge>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {interval ? (
          <p className="font-semibold tabular-nums">
            {formatCurrency(interval.amount, interval.currency)}
            <span className="ml-0.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
              {BILLING_CYCLE_SUFFIX[subscription.billingCycle]}
            </span>
          </p>
        ) : (
          <p className="text-zinc-400">–</p>
        )}
        {showMonthlyEquivalent && (
          <p className="mt-0.5 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            ≈ {formatCurrency(getMonthlyCost(subscription, baseCurrency, rates, today), baseCurrency)}/Mt.
          </p>
        )}
      </div>
    </GlassCard>
  );
}
