import type { Category, ExchangeRates, Subscription, SubscriptionSortKey, SubscriptionStatusFilter } from '../types';
import { getMonthlyCost, getNextChargeDate } from './calculations';
import { isPausedAt, isRunning } from './pauses';

const collator = new Intl.Collator('de-CH', { sensitivity: 'base' });

export function filterSubscriptions(
  subs: Subscription[],
  filter: SubscriptionStatusFilter,
  reference: Date = new Date(),
): Subscription[] {
  switch (filter) {
    case 'all':
      return subs;
    case 'active':
      return subs.filter((sub) => isRunning(sub, reference));
    case 'paused':
      return subs.filter((sub) => sub.isActive && isPausedAt(sub, reference));
    case 'inactive':
      return subs.filter((sub) => !sub.isActive);
  }
}

/** Kleinschreibung ohne Akzente, damit "cafe" auch "Café" findet. */
function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('de-CH');
}

/**
 * Volltextsuche über Name, Tarif, Kategorie, Zahlungsart und Notizen.
 * Mehrere Wörter müssen alle vorkommen (in beliebigen Feldern), z.B. "netflix twint".
 */
export function searchSubscriptions(
  subs: Subscription[],
  query: string,
  categoriesById: Map<string, Category>,
): Subscription[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return subs;
  return subs.filter((sub) => {
    const haystack = normalizeSearch(
      [sub.name, sub.planName, categoriesById.get(sub.categoryId)?.name, sub.paymentMethod, sub.notes].join(' '),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/** Reihenfolge der Status beim Sortieren: laufend, pausiert, inaktiv. */
function statusRank(sub: Subscription, reference: Date): number {
  if (!sub.isActive) return 2;
  return isPausedAt(sub, reference) ? 1 : 0;
}

/**
 * Sortiert nach Fälligkeit (nächste Abbuchung), Kosten (Monatsäquivalent in
 * Basiswährung, teuerste zuerst) oder Name. Pausierte und inaktive Abos stehen
 * bei Fälligkeit und Kosten immer am Ende.
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
      {
        rank: statusRank(sub, reference),
        value:
          key === 'due'
            ? (getNextChargeDate(sub, reference)?.getTime() ?? Number.MAX_SAFE_INTEGER)
            : -getMonthlyCost(sub, baseCurrency, rates, reference),
      },
    ]),
  );

  return [...subs].sort((a, b) => {
    const ma = metric.get(a.id);
    const mb = metric.get(b.id);
    if (!ma || !mb) return byName(a, b);
    return ma.rank - mb.rank || ma.value - mb.value || byName(a, b);
  });
}
