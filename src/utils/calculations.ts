import type { BillingCycle, Charge, ExchangeRates, PriceInterval, Subscription } from '../types';
import { addDays, addMonthsClamped, daysBetween, parseISODate, startOfDay, toISODate } from './dates';

/** Faktor, um einen Betrag pro Zyklus in ein Monatsäquivalent umzurechnen. */
const MONTHLY_FACTOR: Record<BillingCycle, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

const CYCLE_MONTHS: Record<Exclude<BillingCycle, 'weekly'>, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

// ─── Abrechnungsdaten ───────────────────────────────────────────────────────

/** n-te Abbuchung ab dem ersten Abrechnungsdatum (n = 0 ist die erste). */
export function getBillingDate(firstBilling: Date, cycle: BillingCycle, n: number): Date {
  if (cycle === 'weekly') return addDays(firstBilling, n * 7);
  // Immer vom Startdatum aus rechnen, damit Monatsenden nicht "wegdriften".
  return addMonthsClamped(firstBilling, n * CYCLE_MONTHS[cycle]);
}

/** Schätzt den Index der letzten Abbuchung vor `reference` (kann zu klein sein, nie zu gross). */
function estimateCycleIndex(first: Date, cycle: BillingCycle, reference: Date): number {
  if (cycle === 'weekly') return Math.max(0, Math.floor(daysBetween(first, reference) / 7) - 1);
  const months =
    (reference.getFullYear() - first.getFullYear()) * 12 + (reference.getMonth() - first.getMonth());
  return Math.max(0, Math.floor(months / CYCLE_MONTHS[cycle]) - 1);
}

/** Nächste Abbuchung am oder nach `reference`. */
export function getNextBillingDate(sub: Subscription, reference: Date = new Date()): Date {
  const first = parseISODate(sub.firstBillingDate);
  const ref = startOfDay(reference);
  if (first >= ref) return first;

  let n = estimateCycleIndex(first, sub.billingCycle, ref);
  let date = getBillingDate(first, sub.billingCycle, n);
  while (date < ref) {
    n += 1;
    date = getBillingDate(first, sub.billingCycle, n);
  }
  return date;
}

/** Letzter Tag, an dem vor der nächsten Abbuchung noch gekündigt werden kann. */
export function getCancellationDeadline(sub: Subscription, reference: Date = new Date()): Date {
  return addDays(getNextBillingDate(sub, reference), -sub.cancellationNoticeDays);
}

// ─── Preisintervalle (historientreu) ────────────────────────────────────────

/** Preisintervall, das an einem bestimmten Datum gültig war bzw. ist. */
export function getIntervalAt(sub: Subscription, date: Date): PriceInterval | undefined {
  const iso = toISODate(date);
  return sub.intervals.find((i) => i.startDate <= iso && (i.endDate === null || i.endDate >= iso));
}

/** Aktuell gültiges Intervall; fällt auf das offene Intervall zurück (z.B. Startdatum in Zukunft). */
export function getCurrentInterval(sub: Subscription, reference: Date = new Date()): PriceInterval | undefined {
  return getIntervalAt(sub, reference) ?? sub.intervals.find((i) => i.endDate === null);
}

/**
 * Alle tatsächlichen Abbuchungen im Zeitraum [start, end].
 * Jede Abbuchung nutzt den Preis, der an ihrem Datum gültig war –
 * spätere Preisänderungen verändern die Vergangenheit also nicht.
 */
export function getChargesInRange(sub: Subscription, start: Date, end: Date): Charge[] {
  const first = parseISODate(sub.firstBillingDate);
  const from = startOfDay(start);
  const to = startOfDay(end);
  const charges: Charge[] = [];

  let n = from > first ? estimateCycleIndex(first, sub.billingCycle, from) : 0;
  let date = getBillingDate(first, sub.billingCycle, n);
  while (date <= to) {
    if (date >= from) {
      const interval = getIntervalAt(sub, date);
      if (interval) {
        charges.push({
          subscriptionId: sub.id,
          date: toISODate(date),
          amount: interval.amount,
          currency: interval.currency,
        });
      }
    }
    n += 1;
    date = getBillingDate(first, sub.billingCycle, n);
  }
  return charges;
}

// ─── Währungen & Summen ─────────────────────────────────────────────────────

/**
 * Rechnet einen Betrag mit gecachten Frankfurter-Kursen um.
 * Fehlt ein Kurs (z.B. offline beim ersten Start), wird der Betrag unverändert zurückgegeben.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRates | null,
): number {
  if (from === to || !rates) return amount;
  const rateOf = (currency: string): number | undefined =>
    currency === rates.base ? 1 : rates.rates[currency];

  const fromRate = rateOf(from);
  const toRate = rateOf(to);
  if (fromRate === undefined || toRate === undefined) return amount;
  return (amount / fromRate) * toRate;
}

export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  return amount * MONTHLY_FACTOR[cycle];
}

/** Monatsäquivalent eines Abos in der Basiswährung (0 bei inaktiven Abos). */
export function getMonthlyCost(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  if (!sub.isActive) return 0;
  const interval = getCurrentInterval(sub, reference);
  if (!interval) return 0;
  return toMonthlyAmount(convertCurrency(interval.amount, interval.currency, baseCurrency, rates), sub.billingCycle);
}

export function getTotalMonthlyCost(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  return subs.reduce((sum, sub) => sum + getMonthlyCost(sub, baseCurrency, rates, reference), 0);
}

/**
 * Tatsächliche Ausgaben in einem Kalendermonat (month: 0–11).
 * Hinweis: Fremdwährungen werden mit den aktuellen Kursen umgerechnet.
 */
export function getSpendForMonth(
  subs: Subscription[],
  year: number,
  month: number,
  baseCurrency: string,
  rates: ExchangeRates | null,
): number {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return subs
    .flatMap((sub) => getChargesInRange(sub, start, end))
    .reduce((sum, charge) => sum + convertCurrency(charge.amount, charge.currency, baseCurrency, rates), 0);
}
