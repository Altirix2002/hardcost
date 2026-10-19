import type {
  BillingCycle,
  CancellationAlert,
  CancellationWindow,
  Category,
  CategoryShare,
  Charge,
  CostSummary,
  ExchangeRates,
  MonthlySpendPoint,
  PriceInterval,
  Subscription,
  SubscriptionCost,
  UpcomingPayment,
} from '../types';
import { addDays, addMonthsClamped, daysBetween, parseISODate, startOfDay, toISODate } from './dates';

/** Ab so vielen Tagen vor Fristende warnt das Kündigungsradar. */
export const CANCELLATION_ALERT_DAYS = 14;

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

/**
 * Nächste Kündigungsfrist, die sich noch einhalten lässt. Ist die Frist vor der
 * nächsten Abbuchung schon verstrichen, zählt die Frist vor der übernächsten.
 * Liefert null für inaktive oder bereits beendete Abos.
 */
export function getCancellationWindow(sub: Subscription, reference: Date = new Date()): CancellationWindow | null {
  if (!sub.isActive || !getCurrentInterval(sub, reference)) return null;

  const today = startOfDay(reference);
  let renewalDate = getNextBillingDate(sub, today);
  let deadline = addDays(renewalDate, -sub.cancellationNoticeDays);
  while (deadline < today) {
    renewalDate = getNextBillingDate(sub, addDays(renewalDate, 1));
    deadline = addDays(renewalDate, -sub.cancellationNoticeDays);
  }
  return { deadline, renewalDate, daysLeft: daysBetween(today, deadline) };
}

/** Kündigungsalarm, falls die Frist innerhalb von `windowDays` abläuft (nur Abos mit Kündigungsfrist). */
export function getCancellationAlert(
  sub: Subscription,
  reference: Date = new Date(),
  windowDays: number = CANCELLATION_ALERT_DAYS,
): CancellationWindow | null {
  if (sub.cancellationNoticeDays <= 0) return null;
  const window = getCancellationWindow(sub, reference);
  return window && window.daysLeft <= windowDays ? window : null;
}

/** Alle anstehenden Kündigungsalarme, dringendste zuerst. */
export function getCancellationAlerts(
  subs: Subscription[],
  reference: Date = new Date(),
  windowDays: number = CANCELLATION_ALERT_DAYS,
): CancellationAlert[] {
  return subs
    .flatMap((subscription) => {
      const window = getCancellationAlert(subscription, reference, windowDays);
      return window ? [{ subscription, window }] : [];
    })
    .sort((a, b) => a.window.daysLeft - b.window.daysLeft);
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
  const fromRate = rateOf(from, rates);
  const toRate = rateOf(to, rates);
  if (fromRate === undefined || toRate === undefined) return amount;
  return (amount / fromRate) * toRate;
}

function rateOf(currency: string, rates: ExchangeRates): number | undefined {
  return currency === rates.base ? 1 : rates.rates[currency];
}

/** Ob sich `from` mit den vorhandenen Kursen in `to` umrechnen lässt. */
export function canConvert(from: string, to: string, rates: ExchangeRates | null): boolean {
  if (from === to) return true;
  return rates !== null && rateOf(from, rates) !== undefined && rateOf(to, rates) !== undefined;
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

export function getYearlyCost(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  return getMonthlyCost(sub, baseCurrency, rates, reference) * 12;
}

export function getTotalMonthlyCost(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  return subs.reduce((sum, sub) => sum + getMonthlyCost(sub, baseCurrency, rates, reference), 0);
}

/** Monats- und Jahreskosten aller aktiven Abos auf Basis des aktuell gültigen Preises. */
export function getCostSummary(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): CostSummary {
  const active = subs.filter((sub) => sub.isActive);
  const monthly = getTotalMonthlyCost(active, baseCurrency, rates, reference);

  const unconverted = new Set<string>();
  for (const sub of active) {
    const interval = getCurrentInterval(sub, reference);
    if (interval && !canConvert(interval.currency, baseCurrency, rates)) unconverted.add(interval.currency);
  }

  return {
    monthly,
    yearly: monthly * 12,
    activeCount: active.length,
    inactiveCount: subs.length - active.length,
    unconvertedCurrencies: [...unconverted].sort(),
  };
}

/** Die nächsten Abbuchungen aktiver Abos – mit dem Preis, der am Abbuchungstag gilt. */
export function getUpcomingPayments(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
  limit = 3,
): UpcomingPayment[] {
  return subs
    .filter((sub) => sub.isActive)
    .flatMap((subscription) => {
      const date = getNextBillingDate(subscription, reference);
      const interval = getIntervalAt(subscription, date);
      if (!interval) return [];
      const amount = convertCurrency(interval.amount, interval.currency, baseCurrency, rates);
      return [{ subscription, date, amount }];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

/**
 * Tatsächliche Ausgaben in einem Kalendermonat (month: 0–11).
 * Inaktive Abos zählen nur bis heute – künftige Abbuchungen finden nicht mehr statt.
 * Hinweis: Fremdwährungen werden mit den aktuellen Kursen umgerechnet.
 */
export function getSpendForMonth(
  subs: Subscription[],
  year: number,
  month: number,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const today = startOfDay(reference);
  return subs
    .flatMap((sub) => getChargesInRange(sub, start, !sub.isActive && today < end ? today : end))
    .reduce((sum, charge) => sum + convertCurrency(charge.amount, charge.currency, baseCurrency, rates), 0);
}

/** Ausgaben der letzten `months` Kalendermonate inkl. des laufenden, älteste zuerst. */
export function getMonthlySpendHistory(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
  months = 12,
): MonthlySpendPoint[] {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(reference.getFullYear(), reference.getMonth() - (months - 1 - index), 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    return { year, month, total: getSpendForMonth(subs, year, month, baseCurrency, rates, reference) };
  });
}

/** Monatliche Fixkosten aktiver Abos je Kategorie, grösster Anteil zuerst. */
export function getCategoryBreakdown(
  subs: Subscription[],
  categories: Category[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): CategoryShare[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, { monthly: number; count: number }>();

  for (const sub of subs) {
    const monthly = getMonthlyCost(sub, baseCurrency, rates, reference);
    if (monthly <= 0) continue;
    const entry = totals.get(sub.categoryId) ?? { monthly: 0, count: 0 };
    totals.set(sub.categoryId, { monthly: entry.monthly + monthly, count: entry.count + 1 });
  }

  const sum = [...totals.values()].reduce((acc, t) => acc + t.monthly, 0);
  return [...totals.entries()]
    .map(([categoryId, { monthly, count }]) => ({
      category: byId.get(categoryId) ?? UNKNOWN_CATEGORY,
      monthly,
      count,
      share: sum > 0 ? monthly / sum : 0,
    }))
    .sort((a, b) => b.monthly - a.monthly);
}

const UNKNOWN_CATEGORY: Category = { id: 'unknown', name: 'Ohne Kategorie', color: 'slate', isCustom: false };

/** Aktives Abo mit dem höchsten Monatsäquivalent. */
export function getMostExpensiveSubscription(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): SubscriptionCost | null {
  let top: SubscriptionCost | null = null;
  for (const subscription of subs) {
    const monthly = getMonthlyCost(subscription, baseCurrency, rates, reference);
    if (monthly > 0 && (!top || monthly > top.monthly)) top = { subscription, monthly };
  }
  return top;
}
