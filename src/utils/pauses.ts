import type { PausePeriod, Subscription } from '../types';
import { addDays, parseISODate, startOfDay, toISODate } from './dates';
import { createId } from './id';

/** Pause, die am angegebenen Datum gilt. */
export function getPauseAt(sub: Subscription, date: Date): PausePeriod | undefined {
  const iso = toISODate(date);
  return sub.pauses?.find((p) => p.startDate <= iso && (p.endDate === null || p.endDate >= iso));
}

/** Ob das Abo an diesem Tag pausiert ist (Schlummer-Modus). */
export function isPausedAt(sub: Subscription, date: Date = new Date()): boolean {
  return getPauseAt(sub, date) !== undefined;
}

/** Aktiv und nicht pausiert – nur solche Abos verursachen laufende Kosten. */
export function isRunning(sub: Subscription, date: Date = new Date()): boolean {
  return sub.isActive && !isPausedAt(sub, date);
}

/** Erster Tag nach der aktuellen Pause (null = unbefristet bzw. nicht pausiert). */
export function getResumeDate(sub: Subscription, date: Date = new Date()): Date | null {
  const pause = getPauseAt(sub, date);
  return pause?.endDate ? addDays(parseISODate(pause.endDate), 1) : null;
}

/**
 * Pausiert ab heute bzw. passt das Ende einer laufenden Pause an.
 * `until` ist der letzte pausierte Tag (YYYY-MM-DD) oder null für unbefristet.
 */
export function pauseSubscription(sub: Subscription, until: string | null, today: Date = new Date()): Subscription {
  const pauses = sub.pauses ?? [];
  const current = getPauseAt(sub, today);
  if (current) {
    return { ...sub, pauses: pauses.map((p) => (p.id === current.id ? { ...p, endDate: until } : p)) };
  }
  return { ...sub, pauses: [...pauses, { id: createId(), startDate: toISODate(startOfDay(today)), endDate: until }] };
}

/** Beendet die laufende Pause mit gestern; eine erst heute begonnene Pause verschwindet ganz. */
export function resumeSubscription(sub: Subscription, today: Date = new Date()): Subscription {
  const current = getPauseAt(sub, today);
  if (!current) return sub;
  const yesterday = toISODate(addDays(today, -1));
  const pauses = (sub.pauses ?? []).flatMap((p) => {
    if (p.id !== current.id) return [p];
    return p.startDate > yesterday ? [] : [{ ...p, endDate: yesterday }];
  });
  return { ...sub, pauses };
}
