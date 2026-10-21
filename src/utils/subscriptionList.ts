import type { Category, ExchangeRates, Subscription, SubscriptionSortKey, SubscriptionStatusFilter } from '../types';
import { getMonthlyCost, getNextChargeDate } from './calculations';
import { isPausedAt, isRunning } from './pauses';
import { isActiveAt } from './status';

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
      return subs.filter((sub) => isActiveAt(sub, reference) && isPausedAt(sub, reference));
    case 'cancelled':
      // Gekündigt umfasst auslaufende und bereits beendete Abos (die beendeten zeigt die Übersicht im Friedhof).
      return subs.filter((sub) => !sub.isActive || sub.endsOn !== undefined);
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

/** Reihenfolge der Status beim Sortieren: laufend, pausiert, beendet. */
function statusRank(sub: Subscription, reference: Date): number {
  if (!isActiveAt(sub, reference)) return 2;
  return isPausedAt(sub, reference) ? 1 : 0;
}

/**
 * Sortiert nach Fälligkeit (nächste Abbuchung), Kosten (Monatsäquivalent in
 * Basiswährung, teuerste zuerst) oder Name. Pausierte und beendete Abos stehen
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
  if (key === 'manual') {
    // Noch nie angeordnete Abos (neu erfasst) hinten anhängen – in Fälligkeits-Reihenfolge.
    const ordered = subs.filter((sub) => sub.sortOrder !== undefined);
    const rest = subs.filter((sub) => sub.sortOrder === undefined);
    return [
      ...ordered.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      ...sortSubscriptions(rest, 'due', baseCurrency, rates, reference),
    ];
  }

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
