import type {
  BillingCycle,
  CancellationAlert,
  CancellationWindow,
  Category,
  CategoryShare,
  Charge,
  CostSplit,
  CostSummary,
  ExchangeRates,
  LifetimeCost,
  MonthlySpendPoint,
  PaymentMethodShare,
  PriceHike,
  PriceHikeSortKey,
  PriceInterval,
  Subscription,
  SubscriptionCost,
  UpcomingCharge,
  UpcomingChargeMonth,
  UpcomingPayment,
} from '../types';
import { addDays, addMonthsClamped, daysBetween, parseISODate, startOfDay, toISODate } from './dates';
import { getPauseAt, isPausedAt, isRunning } from './pauses';
import { getTrialEnd, hasEndedAt, isActiveAt, isBillableAt, isInTrialAt } from './status';

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

/**
 * Nächste tatsächliche Abbuchung am oder nach `reference` – Testphase und Pausen werden
 * übersprungen. Liefert null, solange das Abo unbefristet pausiert ist oder wenn es vor der
 * nächsten Abbuchung endet (gekündigt).
 */
export function getNextChargeDate(sub: Subscription, reference: Date = new Date()): Date | null {
  const trialEnd = getTrialEnd(sub);
  let date = getNextBillingDate(sub, trialEnd && trialEnd > reference ? trialEnd : reference);
  for (let pause = getPauseAt(sub, date); pause; pause = getPauseAt(sub, date)) {
    if (pause.endDate === null) return null;
    date = getNextBillingDate(sub, addDays(parseISODate(pause.endDate), 1));
  }
  return hasEndedAt(sub, date) ? null : date;
}

/** Letzter Tag, an dem vor der nächsten Abbuchung noch gekündigt werden kann. */
export function getCancellationDeadline(sub: Subscription, reference: Date = new Date()): Date {
  return addDays(getNextBillingDate(sub, reference), -sub.cancellationNoticeDays);
}

/** Letzter Tag der Mindestlaufzeit, falls sie am Stichtag noch läuft. */
export function getActiveCommitmentEnd(sub: Subscription, reference: Date = new Date()): Date | null {
  if (!sub.minimumCommitmentUntil) return null;
  const end = parseISODate(sub.minimumCommitmentUntil);
  return end >= startOfDay(reference) ? end : null;
}

/**
 * Nächste Kündigungsfrist, die sich noch einhalten lässt. Ist die Frist vor der
 * nächsten Abbuchung schon verstrichen, zählt die Frist vor der übernächsten.
 * Während einer Mindestlaufzeit gilt: kündbar erst auf deren Ende (Ende minus Kündigungsfrist);
 * wird diese Frist verpasst, verlängert sich das Abo regulär.
 * Liefert null für inaktive, pausierte oder bereits beendete Abos.
 */
export function getCancellationWindow(sub: Subscription, reference: Date = new Date()): CancellationWindow | null {
  // Bereits gekündigte Abos brauchen keine Frist mehr.
  if (sub.endsOn !== undefined || !isRunning(sub, reference) || !getCurrentInterval(sub, reference)) return null;

  const today = startOfDay(reference);
  const notice = sub.cancellationNoticeDays;
  let from = today;

  // Testphase: Kündigen vor der ersten kostenpflichtigen Abbuchung.
  if (sub.trialEndsAt && isInTrialAt(sub, today)) {
    const trialEnd = parseISODate(sub.trialEndsAt);
    const renewalDate = getNextChargeDate(sub, today) ?? addDays(trialEnd, 1);
    const deadline = addDays(trialEnd, -notice);
    if (deadline >= today) {
      return { deadline, renewalDate, daysLeft: daysBetween(today, deadline), endsCommitment: false, endsTrial: true };
    }
    from = renewalDate;
  }

  const commitmentEnd = getActiveCommitmentEnd(sub, today);
  if (commitmentEnd) {
    // Erste Abbuchung nach der Bindung ist die erste, die sich verhindern lässt.
    const renewalDate = getNextBillingDate(sub, addDays(commitmentEnd, 1));
    const deadline = addDays(commitmentEnd, -notice);
    if (deadline >= today) {
      return { deadline, renewalDate, daysLeft: daysBetween(today, deadline), endsCommitment: true, endsTrial: false };
    }
    from = renewalDate;
  }

  let renewalDate = getNextBillingDate(sub, from);
  let deadline = addDays(renewalDate, -notice);
  while (deadline < today) {
    renewalDate = getNextBillingDate(sub, addDays(renewalDate, 1));
    deadline = addDays(renewalDate, -notice);
  }
  return { deadline, renewalDate, daysLeft: daysBetween(today, deadline), endsCommitment: false, endsTrial: false };
}

/**
 * Kündigungsalarm, falls die Frist innerhalb von `windowDays` abläuft. Gilt für Abos mit
 * Kündigungsfrist sowie für das nahende Ende einer Mindestlaufzeit.
 */
export function getCancellationAlert(
  sub: Subscription,
  reference: Date = new Date(),
  windowDays: number = CANCELLATION_ALERT_DAYS,
): CancellationWindow | null {
  const hasDeadline =
    sub.cancellationNoticeDays > 0 || getActiveCommitmentEnd(sub, reference) !== null || isInTrialAt(sub, reference);
  if (!hasDeadline) return null;
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

// ─── Kosten-Splitting ───────────────────────────────────────────────────────

/** Eigener Anteil an einem Betrag gemäss Aufteilung (ohne Splitting: der volle Betrag). */
export function applySplit(split: CostSplit | undefined, amount: number): number {
  if (!split) return amount;
  if (split.type === 'equal') return split.people > 1 ? amount / split.people : amount;
  return Math.min(split.amount, amount);
}

/** Eigener Anteil an einem Betrag pro Abrechnung. */
export function getOwnAmount(sub: Subscription, amount: number): number {
  return applySplit(sub.split, amount);
}

/**
 * Alle tatsächlichen Abbuchungen im Zeitraum [start, end] – mit dem eigenen Anteil.
 * Jede Abbuchung nutzt den Preis, der an ihrem Datum gültig war –
 * spätere Preisänderungen verändern die Vergangenheit also nicht.
 * Abbuchungen während einer Pause entfallen.
 */
export function getChargesInRange(sub: Subscription, start: Date, end: Date): Charge[] {
  return collectCharges(sub, start, end, false);
}

/** Abbuchungen im Zeitraum, die wegen einer Pause entfallen sind (Ersparnis des Schlummer-Modus). */
export function getSkippedChargesInRange(sub: Subscription, start: Date, end: Date): Charge[] {
  return collectCharges(sub, start, end, true);
}

function collectCharges(sub: Subscription, start: Date, end: Date, paused: boolean): Charge[] {
  const first = parseISODate(sub.firstBillingDate);
  const from = startOfDay(start);
  const to = startOfDay(end);
  const charges: Charge[] = [];

  let n = from > first ? estimateCycleIndex(first, sub.billingCycle, from) : 0;
  let date = getBillingDate(first, sub.billingCycle, n);
  while (date <= to) {
    if (date >= from && isBillableAt(sub, date) && isPausedAt(sub, date) === paused) {
      const interval = getIntervalAt(sub, date);
      if (interval) {
        charges.push({
          subscriptionId: sub.id,
          date: toISODate(date),
          amount: getOwnAmount(sub, interval.amount),
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

/** Monatsäquivalent des eigenen Anteils am aktuellen Preis in der Basiswährung, ohne Status-Prüfung. */
function getMonthlyPrice(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date,
): number {
  const interval = getCurrentInterval(sub, reference);
  if (!interval) return 0;
  const own = getOwnAmount(sub, interval.amount);
  return toMonthlyAmount(convertCurrency(own, interval.currency, baseCurrency, rates), sub.billingCycle);
}

/** Monatsäquivalent des eigenen Anteils in der Basiswährung (0 bei inaktiven, pausierten oder Gratis-Abos). */
export function getMonthlyCost(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  return isRunning(sub, reference) && !isInTrialAt(sub, reference)
    ? getMonthlyPrice(sub, baseCurrency, rates, reference)
    : 0;
}

/** Regulärer Preis als Monatsäquivalent, auch wenn gerade nichts anfällt (Testphase, Pause). */
export function getRegularMonthlyCost(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  return isActiveAt(sub, reference) ? getMonthlyPrice(sub, baseCurrency, rates, reference) : 0;
}

/** Was ein pausiertes Abo regulär kosten würde – zeigt die Ersparnis der Pause. */
export function getPausedMonthlySavings(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): number {
  return isActiveAt(sub, reference) && isPausedAt(sub, reference) ? getMonthlyPrice(sub, baseCurrency, rates, reference) : 0;
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
  const active = subs.filter((sub) => isRunning(sub, reference));
  const pausedCount = subs.filter((sub) => isActiveAt(sub, reference) && isPausedAt(sub, reference)).length;
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
    pausedCount,
    inactiveCount: subs.length - active.length - pausedCount,
    unconvertedCurrencies: [...unconverted].sort(),
  };
}

/** Die nächsten Abbuchungen aktiver Abos – mit dem Preis, der am Abbuchungstag gilt (Pausen übersprungen). */
export function getUpcomingPayments(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
  limit = 3,
): UpcomingPayment[] {
  return subs
    .filter((sub) => isActiveAt(sub, reference))
    .flatMap((subscription) => {
      const date = getNextChargeDate(subscription, reference);
      const interval = date && getIntervalAt(subscription, date);
      if (!date || !interval) return [];
      const own = getOwnAmount(subscription, interval.amount);
      const amount = convertCurrency(own, interval.currency, baseCurrency, rates);
      return [{ subscription, date, amount }];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

/**
 * Alle Abbuchungen aktiver Abos in den nächsten `days` Tagen (heute eingeschlossen),
 * chronologisch – wöchentliche Abos erscheinen also mehrfach.
 */
export function getUpcomingCharges(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
  days = 30,
): UpcomingCharge[] {
  const start = startOfDay(reference);
  return getChargesBetween(
    subs.filter((sub) => sub.isActive),
    start,
    addDays(start, days),
    baseCurrency,
    rates,
    reference,
  );
}

/**
 * Alle Abbuchungen im Zeitraum [start, end] – auch vergangene (z.B. für die Kalenderansicht).
 * Deaktivierte Abos ohne Enddatum zählen nur bis heute, weil ihr Ende unbekannt ist.
 */
export function getChargesBetween(
  subs: Subscription[],
  start: Date,
  end: Date,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): UpcomingCharge[] {
  const today = startOfDay(reference);
  return subs
    .flatMap((subscription) =>
      getChargesInRange(subscription, start, !subscription.isActive && today < end ? today : end).map((charge) => ({
        subscription,
        date: parseISODate(charge.date),
        amount: convertCurrency(charge.amount, charge.currency, baseCurrency, rates),
        originalAmount: charge.amount,
        currency: charge.currency,
      })),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.subscription.name.localeCompare(b.subscription.name, 'de-CH'));
}

/** Fasst chronologisch sortierte Abbuchungen nach Kalendermonat zusammen. */
export function groupChargesByMonth(charges: UpcomingCharge[]): UpcomingChargeMonth[] {
  const months: UpcomingChargeMonth[] = [];
  for (const charge of charges) {
    const year = charge.date.getFullYear();
    const month = charge.date.getMonth();
    let group = months.at(-1);
    if (!group || group.year !== year || group.month !== month) {
      group = { year, month, total: 0, charges: [] };
      months.push(group);
    }
    group.total += charge.amount;
    group.charges.push(charge);
  }
  return months;
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

// ─── Preiserhöhungs-Radar ───────────────────────────────────────────────────

/**
 * Letzte Preiserhöhung je Abo: Vergleicht den aktuellen Preis mit dem vorherigen. Ist bereits ein
 * künftiger Preis erfasst, wird stattdessen diese angekündigte Erhöhung gezeigt.
 * Preissenkungen und Währungswechsel (nicht vergleichbar) werden ignoriert, ebenso inaktive Abos.
 */
export function getPriceHikes(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): PriceHike[] {
  const today = toISODate(reference);
  return subs.flatMap((subscription) => {
    if (!isActiveAt(subscription, reference) || subscription.intervals.length < 2) return [];
    const sorted = [...subscription.intervals].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const currentIndex = sorted.filter((i) => i.startDate <= today).length - 1;
    const upcoming = currentIndex >= 0 ? sorted[currentIndex + 1] : undefined;
    const newer = upcoming ?? sorted[currentIndex];
    const older = upcoming ? sorted[currentIndex] : sorted[currentIndex - 1];
    if (!newer || !older || older.currency !== newer.currency || older.amount <= 0) return [];

    const absoluteChange = newer.amount - older.amount;
    if (absoluteChange <= 0) return [];

    const monthlyIncrease = toMonthlyAmount(
      convertCurrency(absoluteChange, newer.currency, baseCurrency, rates),
      subscription.billingCycle,
    );
    return [
      {
        subscription,
        previousAmount: older.amount,
        currentAmount: newer.amount,
        currency: newer.currency,
        absoluteChange,
        percentageChange: absoluteChange / older.amount,
        monthlyIncrease,
        effectiveDate: newer.startDate,
        isUpcoming: newer.startDate > today,
      },
    ];
  });
}

/** Sortiert nach Mehrkosten pro Monat (vergleichbar über Zyklen/Währungen) oder nach Prozent. */
export function sortPriceHikes(hikes: PriceHike[], key: PriceHikeSortKey): PriceHike[] {
  return [...hikes].sort((a, b) =>
    key === 'percent'
      ? b.percentageChange - a.percentageChange || b.monthlyIncrease - a.monthlyIncrease
      : b.monthlyIncrease - a.monthlyIncrease || b.percentageChange - a.percentageChange,
  );
}

// ─── Zahlungsarten ──────────────────────────────────────────────────────────

/** Bezeichnung für Abos ohne Zahlungsart. */
export const UNKNOWN_PAYMENT_METHOD = 'Ohne Angabe';

/**
 * Rundet Anteile so auf ganze Prozent, dass die Summe exakt 100 ergibt
 * (Methode des grössten Rests) – sonst zeigt die Liste z.B. 33 % + 33 % + 33 %.
 */
export function toWholePercents(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 0);
  const exact = values.map((value) => (value / total) * 100);
  const result = exact.map(Math.floor);
  let missing = 100 - result.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest);
  for (const { index } of byRemainder) {
    if (missing <= 0) break;
    result[index] = (result[index] ?? 0) + 1;
    missing -= 1;
  }
  return result;
}

/** Monatliche Fixkosten laufender Abos je Zahlungsart, grösster Anteil zuerst. */
export function getPaymentMethodBreakdown(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): PaymentMethodShare[] {
  const groups = new Map<string, { method: string; subscriptions: SubscriptionCost[] }>();

  for (const subscription of subs) {
    const monthly = getMonthlyCost(subscription, baseCurrency, rates, reference);
    if (monthly <= 0) continue;
    const method = subscription.paymentMethod.trim() || UNKNOWN_PAYMENT_METHOD;
    const key = method.toLocaleLowerCase('de-CH');
    const group = groups.get(key) ?? { method, subscriptions: [] };
    group.subscriptions.push({ subscription, monthly });
    groups.set(key, group);
  }

  const entries = [...groups.values()]
    .map(({ method, subscriptions }) => ({
      method,
      subscriptions: subscriptions.sort((a, b) => b.monthly - a.monthly),
      monthly: subscriptions.reduce((sum, entry) => sum + entry.monthly, 0),
    }))
    .sort((a, b) => b.monthly - a.monthly);

  const sum = entries.reduce((acc, entry) => acc + entry.monthly, 0);
  const percents = toWholePercents(entries.map((entry) => entry.monthly));
  return entries.map((entry, index) => ({
    ...entry,
    share: sum > 0 ? entry.monthly / sum : 0,
    percent: percents[index] ?? 0,
  }));
}

// ─── Lifetime-Kosten ────────────────────────────────────────────────────────

/** Überlappende Tage zweier geschlossener Zeiträume [aStart, aEnd] und [bStart, bEnd]. */
function overlapDays(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  return end < start ? 0 : daysBetween(start, end) + 1;
}

/**
 * Was seit der ersten Abbuchung tatsächlich bezahlt wurde: Summe aller Einzelabbuchungen bis heute,
 * jeweils mit dem damals gültigen Preis und dem eigenen Anteil. Abbuchungen in Pausen entfallen und
 * werden separat als Ersparnis ausgewiesen. Fremdwährungen werden mit aktuellen Kursen umgerechnet.
 */
export function getLifetimeCost(
  sub: Subscription,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): LifetimeCost {
  const since = parseISODate(sub.firstBillingDate);
  const today = startOfDay(reference);
  const result: LifetimeCost = { totalPaid: 0, chargeCount: 0, since, pausedDays: 0, skippedCharges: 0, savedByPauses: 0 };
  if (since > today) return result;

  for (let n = 0, date = since; date <= today; n += 1, date = getBillingDate(since, sub.billingCycle, n)) {
    const interval = getIntervalAt(sub, date);
    if (!interval || !isBillableAt(sub, date)) continue;
    const amount = convertCurrency(getOwnAmount(sub, interval.amount), interval.currency, baseCurrency, rates);
    if (isPausedAt(sub, date)) {
      result.skippedCharges += 1;
      result.savedByPauses += amount;
    } else {
      result.chargeCount += 1;
      result.totalPaid += amount;
    }
  }

  for (const pause of sub.pauses ?? []) {
    const end = pause.endDate ? parseISODate(pause.endDate) : today;
    result.pausedDays += overlapDays(parseISODate(pause.startDate), end, since, today);
  }
  return result;
}
