import type { Subscription } from '../types';
import { addDays, parseISODate, toISODate } from './dates';

/** In der Gratis-Testphase (bis und mit `trialEndsAt`). */
export function isInTrialAt(sub: Subscription, date: Date = new Date()): boolean {
  return sub.trialEndsAt !== undefined && toISODate(date) <= sub.trialEndsAt;
}

/** Gekündigt und das Laufzeitende ist vorbei. */
export function hasEndedAt(sub: Subscription, date: Date = new Date()): boolean {
  return sub.endsOn !== undefined && toISODate(date) > sub.endsOn;
}

/** Läuft vertraglich noch (nicht deaktiviert und – falls gekündigt – noch vor dem Ende). */
export function isActiveAt(sub: Subscription, date: Date = new Date()): boolean {
  return sub.isActive && !hasEndedAt(sub, date);
}

/** Gekündigt, läuft aber noch aus. */
export function isRunningOut(sub: Subscription, date: Date = new Date()): boolean {
  return sub.isActive && sub.endsOn !== undefined && !hasEndedAt(sub, date);
}

/** Erster kostenpflichtiger Tag nach der Testphase. */
export function getTrialEnd(sub: Subscription): Date | null {
  return sub.trialEndsAt ? addDays(parseISODate(sub.trialEndsAt), 1) : null;
}

/** Ob an diesem Tag eine Abbuchung überhaupt möglich ist (nicht in Testphase, nicht nach Vertragsende). */
export function isBillableAt(sub: Subscription, date: Date): boolean {
  return !isInTrialAt(sub, date) && !hasEndedAt(sub, date);
}
