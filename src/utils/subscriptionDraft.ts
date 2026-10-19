import type {
  DraftValidation,
  IntervalField,
  PriceIntervalDraft,
  PriceIntervalPatch,
  Subscription,
  SubscriptionDraft,
} from '../types';
import { addDays, parseISODate, toISODate } from './dates';
import { createId } from './id';
import { isSupportedCurrency } from './options';

// ─── Parsing ────────────────────────────────────────────────────────────────

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value) && toISODate(parseISODate(value)) === value;
}

/** Akzeptiert "12.90", "12,90" und "1'200.50". */
export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(/['’\s]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function formatAmountInput(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function dayBefore(iso: string): string {
  return toISODate(addDays(parseISODate(iso), -1));
}

function dayAfter(iso: string): string {
  return toISODate(addDays(parseISODate(iso), 1));
}

function sortByStart<T extends { startDate: string }>(intervals: T[]): T[] {
  return [...intervals].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// ─── Umwandlung Entwurf ⇄ Abo ───────────────────────────────────────────────

export function createEmptyDraft(currency: string, today: Date = new Date()): SubscriptionDraft {
  const start = toISODate(today);
  return {
    id: createId(),
    name: '',
    planName: '',
    categoryId: '',
    paymentMethod: '',
    logoUrl: '',
    logoShape: 'squircle',
    billingCycle: 'monthly',
    firstBillingDate: start,
    cancellationNoticeDays: '0',
    currency,
    intervals: [{ id: createId(), startDate: start, endDate: '', amount: '', currency }],
    isActive: true,
    notes: '',
  };
}

export function subscriptionToDraft(sub: Subscription, fallbackCurrency: string): SubscriptionDraft {
  const intervals: PriceIntervalDraft[] = sortByStart(sub.intervals).map((interval) => ({
    id: interval.id,
    startDate: interval.startDate,
    endDate: interval.endDate ?? '',
    amount: formatAmountInput(interval.amount),
    currency: interval.currency,
  }));
  const current = intervals.find((i) => i.endDate === '') ?? intervals[intervals.length - 1];

  return {
    id: sub.id,
    name: sub.name,
    planName: sub.planName ?? '',
    categoryId: sub.categoryId,
    paymentMethod: sub.paymentMethod,
    logoUrl: sub.logoUrl ?? '',
    logoShape: sub.logoShape,
    billingCycle: sub.billingCycle,
    firstBillingDate: sub.firstBillingDate,
    cancellationNoticeDays: String(sub.cancellationNoticeDays),
    currency: current?.currency ?? fallbackCurrency,
    intervals,
    isActive: sub.isActive,
    notes: sub.notes ?? '',
  };
}

/** Setzt einen gültigen Entwurf (siehe validateDraft) in ein speicherbares Abo um. */
export function draftToSubscription(draft: SubscriptionDraft): Subscription {
  const optional = (value: string): string | undefined => (value.trim() === '' ? undefined : value.trim());

  return {
    id: draft.id,
    name: draft.name.trim(),
    planName: optional(draft.planName),
    categoryId: draft.categoryId,
    paymentMethod: draft.paymentMethod.trim(),
    logoUrl: optional(draft.logoUrl),
    logoShape: draft.logoShape,
    billingCycle: draft.billingCycle,
    firstBillingDate: draft.firstBillingDate,
    cancellationNoticeDays: Number.parseInt(draft.cancellationNoticeDays, 10) || 0,
    intervals: sortByStart(draft.intervals).map((interval) => ({
      id: interval.id,
      startDate: interval.startDate,
      endDate: interval.endDate === '' ? null : interval.endDate,
      amount: parseAmount(interval.amount) ?? 0,
      currency: interval.currency,
    })),
    isActive: draft.isActive,
    notes: optional(draft.notes),
  };
}

// ─── Validierung ────────────────────────────────────────────────────────────

export function validateDraft(draft: SubscriptionDraft): DraftValidation {
  const fields: DraftValidation['fields'] = {};
  const intervals: DraftValidation['intervals'] = {};
  const flag = (id: string, field: IntervalField, message: string) => {
    const existing = intervals[id] ?? {};
    if (!existing[field]) intervals[id] = { ...existing, [field]: message };
  };

  if (!draft.name.trim()) fields.name = 'Bitte einen Namen eingeben.';
  if (!draft.categoryId) fields.categoryId = 'Bitte eine Kategorie wählen.';
  if (!isValidISODate(draft.firstBillingDate)) fields.firstBillingDate = 'Bitte ein gültiges Datum wählen.';
  if (!/^\d+$/.test(draft.cancellationNoticeDays.trim())) fields.cancellationNoticeDays = 'Ganze Tage ab 0.';
  if (draft.intervals.length === 0) fields.intervals = 'Mindestens ein Preis ist nötig.';

  const sorted = sortByStart(draft.intervals);
  sorted.forEach((interval, index) => {
    const hasStart = isValidISODate(interval.startDate);
    if (!hasStart) flag(interval.id, 'startDate', 'Startdatum fehlt.');

    if (interval.endDate !== '') {
      if (!isValidISODate(interval.endDate)) flag(interval.id, 'endDate', 'Ungültiges Datum.');
      else if (hasStart && interval.endDate < interval.startDate) flag(interval.id, 'endDate', 'Liegt vor dem Start.');
    }

    const amount = parseAmount(interval.amount);
    if (amount === null || amount <= 0) flag(interval.id, 'amount', 'Betrag grösser als 0.');
    if (!isSupportedCurrency(interval.currency)) flag(interval.id, 'currency', 'Unbekannte Währung.');

    const next = sorted[index + 1];
    if (!next) return;
    if (interval.endDate === '') flag(interval.id, 'endDate', 'Nur der neueste Preis darf offen sein.');
    else if (next.startDate <= interval.endDate) flag(next.id, 'startDate', 'Überschneidet den vorherigen Preis.');
  });

  const isValid = Object.keys(fields).length === 0 && Object.keys(intervals).length === 0;
  return { isValid, fields, intervals };
}

// ─── Entwurfs-Operationen ───────────────────────────────────────────────────

/** Ändert das erste Abrechnungsdatum und zieht den Start eines einzelnen, noch synchronen Preises mit. */
export function setFirstBillingDate(draft: SubscriptionDraft, date: string): SubscriptionDraft {
  const [only] = draft.intervals;
  const syncStart = draft.intervals.length === 1 && only?.startDate === draft.firstBillingDate;
  return {
    ...draft,
    firstBillingDate: date,
    intervals: syncStart ? draft.intervals.map((i) => ({ ...i, startDate: date })) : draft.intervals,
  };
}

/** Setzt die Standardwährung und übernimmt sie für den aktuell gültigen Preis. */
export function setDraftCurrency(draft: SubscriptionDraft, currency: string): SubscriptionDraft {
  return {
    ...draft,
    currency,
    intervals: draft.intervals.map((i) => (i.endDate === '' ? { ...i, currency } : i)),
  };
}

export function updatePriceInterval(draft: SubscriptionDraft, id: string, patch: PriceIntervalPatch): SubscriptionDraft {
  return { ...draft, intervals: draft.intervals.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
}

/**
 * Erfasst eine Preisänderung: Der bisher offene Preis endet am Vortag,
 * der neue gilt ab heute (bzw. ab dem Tag nach dem letzten Intervall).
 */
export function addPriceChange(draft: SubscriptionDraft, today: Date = new Date()): SubscriptionDraft {
  const last = sortByStart(draft.intervals).at(-1);
  let start = toISODate(today);
  if (last && isValidISODate(last.startDate) && start <= last.startDate) start = dayAfter(last.startDate);
  if (last && isValidISODate(last.endDate) && start <= last.endDate) start = dayAfter(last.endDate);

  const closed = draft.intervals.map((i) =>
    i.id === last?.id && i.endDate === '' ? { ...i, endDate: dayBefore(start) } : i,
  );
  const added: PriceIntervalDraft = {
    id: createId(),
    startDate: start,
    endDate: '',
    amount: last?.amount ?? '',
    currency: draft.currency,
  };
  return { ...draft, intervals: [...closed, added] };
}

/** Entfernt einen Preis. Fällt der neueste weg, gilt der direkt anschliessende Vorgänger wieder unbefristet. */
export function removePriceInterval(draft: SubscriptionDraft, id: string): SubscriptionDraft {
  if (draft.intervals.length <= 1) return draft;
  const sorted = sortByStart(draft.intervals);
  const index = sorted.findIndex((i) => i.id === id);
  const removed = sorted[index];
  if (!removed) return draft;

  const previous = sorted[index - 1];
  const reopen =
    index === sorted.length - 1 &&
    removed.endDate === '' &&
    previous !== undefined &&
    isValidISODate(removed.startDate) &&
    previous.endDate === dayBefore(removed.startDate);

  return {
    ...draft,
    intervals: draft.intervals
      .filter((i) => i.id !== id)
      .map((i) => (reopen && i.id === previous.id ? { ...i, endDate: '' } : i)),
  };
}
