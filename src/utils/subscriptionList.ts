import type { ExchangeRates, Subscription, SubscriptionSortKey, SubscriptionStatusFilter } from '../types';
import { getMonthlyCost, getNextBillingDate } from './calculations';

const collator = new Intl.Collator('de-CH', { sensitivity: 'base' });

export function filterSubscriptions(subs: Subscription[], filter: SubscriptionStatusFilter): Subscription[] {
  if (filter === 'all') return subs;
  return subs.filter((sub) => sub.isActive === (filter === 'active'));
}

/**
 * Sortiert nach Fälligkeit (nächste Abbuchung), Kosten (Monatsäquivalent in
 * Basiswährung, teuerste zuerst) oder Name. Inaktive Abos stehen bei
 * Fälligkeit und Kosten immer am Ende.
 */
export function sortSubscriptions(
  subs: Subscription[],
  key: SubscriptionSortKey,
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): Subscription[] {
  const byName = (a: Subscription, b: Subscription) => collator.compare(a.name, b.name);
  if (key === 'name') return [...subs].sort(byName);

  // Sortierschlüssel einmal vorberechnen statt in jedem Vergleich.
  const metric = new Map(
    subs.map((sub) => [
      sub.id,
      key === 'due'
        ? getNextBillingDate(sub, reference).getTime()
        : -getMonthlyCost(sub, baseCurrency, rates, reference),
    ]),
  );

  return [...subs].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return (metric.get(a.id) ?? 0) - (metric.get(b.id) ?? 0) || byName(a, b);
  });
}
