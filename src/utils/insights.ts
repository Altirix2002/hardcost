import type {
  Category,
  CategoryBudgetLevel,
  CategoryBudgetStatus,
  CostRatio,
  CostRatioThresholds,
  ExchangeRates,
  PriceHike,
  SavingsSimulation,
  Subscription,
  WrappedSummary,
} from '../types';
import {
  convertCurrency,
  getChargesInRange,
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

// ─── HardCost Wrapped ───────────────────────────────────────────────────────

/**
 * Hätte ein gekündigtes Abo nach seinem letzten Preis weitergelaufen, wären diese Beträge angefallen.
 * Messbar über das Kündigungs-Enddatum oder – bei älteren Daten – das Enddatum des letzten Preises.
 */
function getAvoidedByCancellation(
  sub: Subscription,
  start: Date,
  end: Date,
  baseCurrency: string,
  rates: ExchangeRates | null,
): number {
  const last = [...sub.intervals].sort((a, b) => a.startDate.localeCompare(b.startDate)).at(-1);
  const endedOnIso = sub.endsOn ?? (sub.isActive ? undefined : last?.endDate);
  if (!last || !endedOnIso) return 0;
  const endedOn = parseISODate(endedOnIso);
  if (endedOn >= end) return 0;

  const own = convertCurrency(getOwnAmount(sub, last.amount), last.currency, baseCurrency, rates);
  let total = 0;
  let date = getNextBillingDate(sub, endedOn >= start ? addDays(endedOn, 1) : start);
  while (date <= end) {
    // Jede Abbuchung nach dem Ende hätte den letzten Preis gekostet.
    total += own;
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

// ─── Budget ─────────────────────────────────────────────────────────────────

/** Ab diesem Anteil warnt die Budget-Anzeige. */
export const BUDGET_WARNING_SHARE = 0.9;

export type BudgetLevel = 'ok' | 'warning' | 'over';

export interface BudgetStatus {
  share: number; // 0–∞ (1 = Budget genau ausgeschöpft)
  remaining: number; // negativ = überschritten
  level: BudgetLevel;
}

export function getBudgetStatus(monthly: number, budget: number): BudgetStatus {
  const share = budget > 0 ? monthly / budget : 0;
  const level: BudgetLevel = share > 1 ? 'over' : share >= BUDGET_WARNING_SHARE ? 'warning' : 'ok';
  return { share, remaining: budget - monthly, level };
}

// ─── Kategorie-Budgets (Abo-Deckel) ─────────────────────────────────────────

export const CATEGORY_BUDGET_NOTICE_SHARE = 0.8;
export const CATEGORY_BUDGET_WARNING_SHARE = 0.95;

export function getCategoryBudgetLevel(share: number): CategoryBudgetLevel {
  if (share > 1) return 'over';
  if (share >= CATEGORY_BUDGET_WARNING_SHARE) return 'warning';
  if (share >= CATEGORY_BUDGET_NOTICE_SHARE) return 'notice';
  return 'ok';
}

/**
 * Auslastung aller Kategorien mit Limit. Verglichen wird mit den monatlichen Durchschnittskosten
 * (Jahresabo ÷ 12) – sonst löste ein Jahresabo im Abbuchungsmonat einen falschen Alarm aus.
 * Höchste Auslastung zuerst.
 */
export function getCategoryBudgets(
  subs: Subscription[],
  categories: Category[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): CategoryBudgetStatus[] {
  return categories
    .flatMap((category): CategoryBudgetStatus[] => {
      const budget = category.monthlyBudget;
      if (budget === undefined || budget <= 0) return [];
      const monthly = subs
        .filter((sub) => sub.categoryId === category.id)
        .reduce((sum, sub) => sum + getMonthlyCost(sub, baseCurrency, rates, reference), 0);
      const share = monthly / budget;
      return [{ category, budget, monthly, share, level: getCategoryBudgetLevel(share) }];
    })
    .sort((a, b) => b.share - a.share);
}

// ─── Fixkosten-Quote ────────────────────────────────────────────────────────

export const DEFAULT_COST_RATIO_THRESHOLDS: CostRatioThresholds = { green: 0.1, yellow: 0.2 };

/** Anteil der monatlichen Abo-Kosten am Nettoeinkommen samt Ampel; null ohne Einkommen. */
export function getCostRatio(
  monthly: number,
  netIncome: number | undefined,
  thresholds: CostRatioThresholds = DEFAULT_COST_RATIO_THRESHOLDS,
): CostRatio | null {
  if (netIncome === undefined || netIncome <= 0) return null;
  const ratio = monthly / netIncome;
  const level = ratio <= thresholds.green ? 'green' : ratio <= thresholds.yellow ? 'yellow' : 'red';
  return { ratio, level };
}
