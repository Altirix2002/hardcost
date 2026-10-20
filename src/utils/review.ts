import type { Subscription } from '../types';
import { daysBetween, parseISODate, toISODate } from './dates';
import { isRunning } from './pauses';
import { isInTrialAt } from './status';

/** Ab so vielen Tagen ohne Prüfung oder Änderung gilt ein laufendes Abo als mögliche Karteileiche. */
export const ZOMBIE_AFTER_DAYS = 180;

/**
 * Letzte nachweisbare Berührung: Prüfung/Bearbeitung, Preisänderung, Pause oder Vertragsbeginn.
 * Liefert das späteste dieser Daten (YYYY-MM-DD).
 */
export function getLastTouchedDate(sub: Subscription, reference: Date = new Date()): string {
  const today = toISODate(reference);
  const candidates = [
    sub.firstBillingDate,
    sub.lastReviewedAt,
    ...sub.intervals.map((i) => i.startDate),
    ...(sub.pauses ?? []).flatMap((p) => [p.startDate, p.endDate ?? today]),
  ].filter((date): date is string => date !== undefined && date <= today);
  return candidates.reduce((latest, date) => (date > latest ? date : latest), sub.firstBillingDate);
}

/** Laufendes Abo, das seit über einem halben Jahr niemand angeschaut hat (nicht gekündigt, nicht in Testphase). */
export function isZombie(sub: Subscription, reference: Date = new Date()): boolean {
  if (!isRunning(sub, reference) || sub.endsOn !== undefined || isInTrialAt(sub, reference)) return false;
  return daysBetween(parseISODate(getLastTouchedDate(sub, reference)), reference) > ZOMBIE_AFTER_DAYS;
}

/** Markiert das Abo als geprüft – der Zombie-Hinweis verschwindet für ein halbes Jahr. */
export function markReviewed(sub: Subscription, reference: Date = new Date()): Subscription {
  return { ...sub, lastReviewedAt: toISODate(reference) };
}
