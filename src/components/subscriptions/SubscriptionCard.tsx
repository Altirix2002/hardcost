import { AlarmClock, CalendarClock, PauseCircle } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { getCancellationAlert, getCurrentInterval, getMonthlyCost, getNextBillingDate } from '../../utils/calculations';
import { daysBetween } from '../../utils/dates';
import { BILLING_CYCLE_SUFFIX, formatCurrency, formatDate, formatRelativeDays } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { SubscriptionLogo } from './SubscriptionLogo';

interface SubscriptionCardProps {
  subscription: Subscription;
  category?: Category;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

export function SubscriptionCard({ subscription, category, baseCurrency, rates, onSelect }: SubscriptionCardProps) {
  const today = new Date();
  const { isActive, billingCycle } = subscription;
  const interval = getCurrentInterval(subscription, today);
  const monthly = getMonthlyCost(subscription, baseCurrency, rates, today);
  const nextBilling = getNextBillingDate(subscription, today);
  const alert = getCancellationAlert(subscription, today);
  const showOriginalPrice = interval !== undefined && (interval.currency !== baseCurrency || billingCycle !== 'monthly');

  return (
    <GlassCard
      interactive={Boolean(onSelect)}
      onClick={onSelect ? () => onSelect(subscription) : undefined}
      className={cn('flex h-full flex-col gap-4 p-4', !isActive && 'opacity-60')}
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
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(monthly, baseCurrency)}
              <span className="ml-0.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">/Mt.</span>
            </p>
          ) : (
            <p className="text-xl font-semibold text-zinc-400">–</p>
          )}
          {interval && showOriginalPrice && (
            <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
              {formatCurrency(interval.amount, interval.currency)}
              {BILLING_CYCLE_SUFFIX[billingCycle]}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right text-xs text-zinc-500 dark:text-zinc-400">
          {isActive ? (
            <>
              <p className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                {formatDate(nextBilling)}
              </p>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatRelativeDays(daysBetween(today, nextBilling))}
              </p>
            </>
          ) : (
            <p className="inline-flex items-center gap-1">
              <PauseCircle className="h-3.5 w-3.5" aria-hidden />
              Inaktiv
            </p>
          )}
        </div>
      </div>

      {alert && (
        <div className="-mt-1">
          <Badge color="amber" icon={AlarmClock}>
            Kündigen bis {formatDate(alert.deadline)}
          </Badge>
        </div>
      )}
    </GlassCard>
  );
}
