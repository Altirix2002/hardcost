import type { ExchangeRates, PriceHike, SavingsSimulation, Subscription, WrappedSummary } from '../types';
import {
  convertCurrency,
  getChargesInRange,
  getIntervalAt,
  getMonthlyCost,
  getNextBillingDate,
  getOwnAmount,
  getPriceHikes,
  getSkippedChargesInRange,
} from './calculations';
import { addDays, addMonthsClamped, parseISODate, startOfDay } from './dates';

// ─── Spar-Simulator ─────────────────────────────────────────────────────────

/**
 * Was das Kündigen der abgewählten Abos bringen würde – auf Basis des eigenen Anteils
 * (geteilte Abos sparen also nur, was du selbst zahlst).
 */
export function simulateSavings(
  subs: Subscription[],
  cancelledIds: ReadonlySet<string>,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): SavingsSimulation {
  let currentMonthly = 0;
  let savedMonthly = 0;
  for (const sub of subs) {
    const monthly = getMonthlyCost(sub, baseCurrency, rates, reference);
    currentMonthly += monthly;
    if (cancelledIds.has(sub.id)) savedMonthly += monthly;
  }
  return {
    currentMonthly,
    newMonthly: currentMonthly - savedMonthly,
    savedMonthly,
    savedYearly: savedMonthly * 12,
    savedThreeYears: savedMonthly * 36,
    reduction: currentMonthly > 0 ? savedMonthly / currentMonthly : 0,
  };
}

// ─── SubPulse Wrapped ───────────────────────────────────────────────────────

/**
 * Hätte ein gekündigtes Abo nach seinem letzten Preis weiterlaufen, wären diese Beträge angefallen.
 * Nur messbar, wenn der letzte Preis ein Enddatum hat (sonst ist das Kündigungsdatum unbekannt).
 */
function getAvoidedByCancellation(
  sub: Subscription,
  start: Date,
  end: Date,
  baseCurrency: string,
  rates: ExchangeRates | null,
): number {
  if (sub.isActive) return 0;
  const last = [...sub.intervals].sort((a, b) => a.startDate.localeCompare(b.startDate)).at(-1);
  if (!last?.endDate) return 0;
  const endedOn = parseISODate(last.endDate);
  if (endedOn >= end) return 0;

  const own = convertCurrency(getOwnAmount(sub, last.amount), last.currency, baseCurrency, rates);
  let total = 0;
  let date = getNextBillingDate(sub, endedOn >= start ? addDays(endedOn, 1) : start);
  while (date <= end) {
    // Abbuchungen nach dem Ende hätten den letzten Preis gekostet; vor dem Zeitraum zählt nichts.
    if (!getIntervalAt(sub, date)) total += own;
    date = getNextBillingDate(sub, addDays(date, 1));
  }
  return total;
}

/** Jahresrückblick über die letzten 12 Monate bis heute. */
export function getWrappedSummary(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): WrappedSummary {
  const periodEnd = startOfDay(reference);
  const periodStart = addDays(addMonthsClamped(periodEnd, -12), 1);

  let totalSpent = 0;
  let chargeCount = 0;
  let subscriptionCount = 0;
  let savedByPauses = 0;
  let savedByCancellations = 0;
  let topSubscription: WrappedSummary['topSubscription'] = null;

  for (const subscription of subs) {
    const charges = getChargesInRange(subscription, periodStart, periodEnd);
    const total = charges.reduce(
      (sum, charge) => sum + convertCurrency(charge.amount, charge.currency, baseCurrency, rates),
      0,
    );
    if (charges.length > 0) subscriptionCount += 1;
    chargeCount += charges.length;
    totalSpent += total;
    if (total > 0 && (!topSubscription || total > topSubscription.total)) topSubscription = { subscription, total };

    savedByPauses += getSkippedChargesInRange(subscription, periodStart, periodEnd).reduce(
      (sum, charge) => sum + convertCurrency(charge.amount, charge.currency, baseCurrency, rates),
      0,
    );
    savedByCancellations += getAvoidedByCancellation(subscription, periodStart, periodEnd, baseCurrency, rates);
  }

  const hikesInPeriod = getPriceHikes(subs, baseCurrency, rates, reference).filter(
    (hike) => !hike.isUpcoming && parseISODate(hike.effectiveDate) >= periodStart,
  );
  const biggestHike = hikesInPeriod.reduce<PriceHike | null>(
    (top, hike) => (!top || hike.percentageChange > top.percentageChange ? hike : top),
    null,
  );

  return {
    periodStart,
    periodEnd,
    totalSpent,
    chargeCount,
    subscriptionCount,
    topSubscription,
    biggestHike,
    savedByPauses,
    savedByCancellations,
  };
}
