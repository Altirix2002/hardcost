import { AlarmClock, CalendarClock, CalendarX, CreditCard, Gift, Lock, Moon, Users } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Category, ExchangeRates, Subscription } from '../../types';
import {
  getActiveCommitmentEnd,
  getBindingEnd,
  getCancellationAlert,
  getCurrentInterval,
  getMonthlyCost,
  getNextChargeDate,
  getRegularMonthlyCost,
  hasNoticePeriod,
} from '../../utils/calculations';
import { addDays, daysBetween, parseISODate } from '../../utils/dates';
import { BILLING_CYCLE_SUFFIX, formatCurrency, formatDate, formatRelativeDays } from '../../utils/format';
import { cn } from '../../utils/cn';
import { getResumeDate, isPausedAt } from '../../utils/pauses';
import {
  CARD_EXPIRY_ALERT_DAYS,
  PAYMENT_CARD_KIND_LABELS,
  findPaymentCard,
  formatCardExpiry,
  getCardExpiryDate,
} from '../../utils/paymentCards';
import { isZombie } from '../../utils/review';
import { isActiveAt, isInTrialAt, isRunningOut } from '../../utils/status';
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
  const { billingCycle, split, endsOn, trialEndsAt } = subscription;
  const isActive = isActiveAt(subscription, today);
  const isPaused = isActive && isPausedAt(subscription, today);
  const isRunning = isActive && !isPaused;
  const inTrial = isActive && isInTrialAt(subscription, today);
  const runningOut = isRunningOut(subscription, today);
  const interval = getCurrentInterval(subscription, today);
  const isFree = interval?.amount === 0;
  // Pause und Testphase: regulären Preis zeigen (durchgestrichen bzw. als "danach").
  const monthly =
    isPaused || inTrial
      ? getRegularMonthlyCost(subscription, baseCurrency, rates, today)
      : getMonthlyCost(subscription, baseCurrency, rates, today);
  const nextBilling = getNextChargeDate(subscription, today);
  const resumeDate = isPaused ? getResumeDate(subscription, today) : null;
  const alert = getCancellationAlert(subscription, today);
  // Bei Testphase ohne Kündigungsfrist sagt "Gratis bis …" bereits alles.
  const showAlert = alert !== null && !(alert.endsTrial && !hasNoticePeriod(subscription));
  const bindingEnd = isActive && !endsOn ? getBindingEnd(subscription, today) : null;
  const inCommitment = bindingEnd !== null && getActiveCommitmentEnd(subscription, today) !== null;
  const zombie = isZombie(subscription, today);
  // Bezahlkarte: Wegwerfkarten immer markieren, Ablauf erst ab 30 Tagen vorher.
  const card = findPaymentCard(useSettingsStore((st) => st.settings.paymentCards), subscription.paymentMethod);
  const cardExpiry = card ? getCardExpiryDate(card) : null;
  const cardDaysLeft = isRunning && cardExpiry ? daysBetween(today, cardExpiry) : null;
  const cardExpiring = cardDaysLeft !== null && cardDaysLeft <= CARD_EXPIRY_ALERT_DAYS;
  const disposableCard = isActive && card !== undefined && card.kind !== 'standard';
  const showOriginalPrice =
    interval !== undefined &&
    !inTrial &&
    !isFree &&
    (split !== undefined || interval.currency !== baseCurrency || billingCycle !== 'monthly');
  const hasBadges = showAlert || bindingEnd !== null || inTrial || runningOut || cardExpiring || disposableCard;

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
          {isActive && interval && (inTrial || isFree) ? (
            <>
              <p className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">Gratis</p>
              {inTrial && !isFree && (
                <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  danach {formatCurrency(monthly, baseCurrency)}/Mt.
                </p>
              )}
            </>
          ) : isActive && interval ? (
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
          ) : runningOut ? (
            <>
              <p className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                <CalendarX className="h-3.5 w-3.5" aria-hidden />
                Läuft aus
              </p>
              <p>keine Abbuchung mehr</p>
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
            <>
              <p className="inline-flex items-center gap-1">
                <CalendarX className="h-3.5 w-3.5" aria-hidden />
                Gekündigt
              </p>
              <p>{endsOn ? `beendet am ${formatDate(parseISODate(endsOn), true)}` : 'beendet'}</p>
            </>
          )}
        </div>
      </div>

      {hasBadges && (
        <div className="-mt-1 flex flex-wrap gap-2">
          {inTrial && trialEndsAt && (
            <Badge color="sky" icon={Gift}>
              Gratis bis {formatDate(parseISODate(trialEndsAt))}
            </Badge>
          )}
          {runningOut && endsOn && (
            <Badge color="rose" icon={CalendarX}>
              Gekündigt · endet {formatDate(parseISODate(endsOn))}
            </Badge>
          )}
          {showAlert && alert && (
            <Badge color="amber" icon={AlarmClock}>
              Kündigen bis {formatDate(alert.deadline)}
            </Badge>
          )}
          {card && cardExpiring && (
            <Badge color={cardDaysLeft !== null && cardDaysLeft < 0 ? 'rose' : 'amber'} icon={CreditCard}>
              {cardDaysLeft !== null && cardDaysLeft < 0
                ? 'Karte abgelaufen'
                : `Karte läuft ab ${formatCardExpiry(card.expiresAt ?? '')}`}
            </Badge>
          )}
          {card && disposableCard && !cardExpiring && (
            <Badge color="violet" icon={CreditCard}>
              {PAYMENT_CARD_KIND_LABELS[card.kind]}
            </Badge>
          )}
          {bindingEnd && (
            <Badge color="indigo" icon={Lock}>
              {inCommitment ? 'Mindestlaufzeit' : 'Laufzeit'} bis {formatDate(bindingEnd, true)}
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
