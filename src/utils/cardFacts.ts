import type { ExchangeRates, PaymentCard, Subscription, SubscriptionFacts } from '../types';
import {
  getBindingEnd,
  getCancellationWindow,
  getIntervalAt,
  getLifetimeCost,
  getNextChargeDate,
  getOwnAmount,
  hasNoticePeriod,
} from './calculations';
import { parseISODate } from './dates';
import { findPaymentCard } from './paymentCards';

/** Alles, was die Kartenrückseite zeigt – an einem Stichtag, damit Liste und Kachel übereinstimmen. */
export function getSubscriptionFacts(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  cards: PaymentCard[] | undefined,
  reference: Date = new Date(),
): SubscriptionFacts {
  const next = getNextChargeDate(sub, reference);
  const interval = next ? getIntervalAt(sub, next) : undefined;
  const window = getCancellationWindow(sub, reference);
  const hasDeadline = hasNoticePeriod(sub) || sub.renewal?.type === 'fixed' || sub.minimumCommitmentUntil !== undefined;

  return {
    nextCharge:
      next && interval ? { date: next, amount: getOwnAmount(sub, interval.amount), currency: interval.currency } : null,
    cancelBy: window && hasDeadline ? window.deadline : null,
    boundUntil: sub.endsOn === undefined ? getBindingEnd(sub, reference) : null,
    renewsForMonths: sub.renewal?.type === 'fixed' ? sub.renewal.months : undefined,
    paymentMethod: sub.paymentMethod,
    card: findPaymentCard(cards, sub.paymentMethod),
    paidTotal: getLifetimeCost(sub, baseCurrency, rates, reference).totalPaid,
    since: parseISODate(sub.firstBillingDate),
  };
}
