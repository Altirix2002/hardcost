import type { ArchiveEntry, ArchiveSummary, ExchangeRates, Subscription } from '../types';
import { convertCurrency, getOwnAmount, toMonthlyAmount } from './calculations';
import { addDays, parseISODate, startOfDay, toISODate } from './dates';
import { createId } from './id';
import { getAvoidedByCancellation } from './insights';
import { isActiveAt } from './status';

// ─── Abo-Friedhof ───────────────────────────────────────────────────────────

/** Wirklich beendet: deaktiviert oder das Laufzeitende ist vorbei (auslaufende Abos zählen noch nicht). */
export function isArchived(sub: Subscription, reference: Date = new Date()): boolean {
  return !isActiveAt(sub, reference);
}

function getLastInterval(sub: Subscription) {
  return [...sub.intervals].sort((a, b) => a.startDate.localeCompare(b.startDate)).at(-1);
}

/** Letzter Vertragstag; bei älteren Daten das Ende des letzten Preises, sonst unbekannt. */
export function getEndedOn(sub: Subscription): Date | null {
  const iso = sub.endsOn ?? getLastInterval(sub)?.endDate ?? undefined;
  return iso ? parseISODate(iso) : null;
}

/**
 * Alle beendeten Abos mit dem, was seit dem Ende real gespart wurde (jede Abbuchung, die
 * zum letzten Preis angefallen wäre). Zuletzt beendete zuerst.
 */
export function getArchiveSummary(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRates | null,
  reference: Date = new Date(),
): ArchiveSummary {
  const today = startOfDay(reference);
  const entries = subs
    .filter((sub) => isArchived(sub, today))
    .map((subscription): ArchiveEntry => {
      const endedOn = getEndedOn(subscription);
      const last = getLastInterval(subscription);
      const monthly = last
        ? toMonthlyAmount(
            convertCurrency(getOwnAmount(subscription, last.amount), last.currency, baseCurrency, rates),
            subscription.billingCycle,
          )
        : 0;
      const saved = endedOn ? getAvoidedByCancellation(subscription, endedOn, today, baseCurrency, rates) : 0;
      return { subscription, endedOn, monthly, saved };
    })
    .sort((a, b) => (b.endedOn?.getTime() ?? 0) - (a.endedOn?.getTime() ?? 0));

  return {
    entries,
    totalSaved: entries.reduce((sum, entry) => sum + entry.saved, 0),
    monthlySaved: entries.reduce((sum, entry) => sum + entry.monthly, 0),
  };
}

/**
 * Holt ein beendetes Abo zurück: Kündigung aufheben, letzten Preis wieder öffnen und die Zeit
 * dazwischen als Pause eintragen – so zählen Statistiken keine Abbuchungen, die es nie gab.
 * Der Abrechnungsrhythmus läuft ab der ersten Abbuchung weiter.
 */
export function reactivateSubscription(sub: Subscription, reference: Date = new Date()): Subscription {
  const today = startOfDay(reference);
  const endedOn = getEndedOn(sub);
  const last = getLastInterval(sub);
  const gapStart = endedOn ? addDays(endedOn, 1) : null;
  const gapEnd = addDays(today, -1);
  const pauses = [...(sub.pauses ?? [])];
  if (gapStart && gapStart <= gapEnd) {
    pauses.push({ id: createId(), startDate: toISODate(gapStart), endDate: toISODate(gapEnd) });
  }

  return {
    ...sub,
    isActive: true,
    endsOn: undefined,
    intervals: sub.intervals.map((interval) =>
      interval.id === last?.id && interval.endDate !== null ? { ...interval, endDate: null } : interval,
    ),
    pauses: pauses.length ? pauses : undefined,
    lastReviewedAt: toISODate(today),
  };
}
