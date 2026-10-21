import type {
  CostSplit,
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
import { getPauseAt, pauseSubscription, resumeSubscription } from './pauses';

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
    noticeUnit: 'days',
    noticeToMonthEnd: false,
    renewalType: 'flexible',
    renewalMonths: '12',
    currency,
    intervals: [{ id: createId(), startDate: start, endDate: '', amount: '', currency }],
    notes: '',
    isTrial: false,
    trialEndsAt: '',
    isCancelled: false,
    endsOn: '',
    isShared: false,
    splitType: 'equal',
    splitPeople: '2',
    splitAmount: '',
    isPaused: false,
    pausedUntil: '',
    pauses: [],
    minimumCommitmentUntil: '',
  };
}

export function subscriptionToDraft(
  sub: Subscription,
  fallbackCurrency: string,
  today: Date = new Date(),
): SubscriptionDraft {
  const intervals: PriceIntervalDraft[] = sortByStart(sub.intervals).map((interval) => ({
    id: interval.id,
    startDate: interval.startDate,
    endDate: interval.endDate ?? '',
    amount: formatAmountInput(interval.amount),
    currency: interval.currency,
  }));
  const current = intervals.find((i) => i.endDate === '') ?? intervals[intervals.length - 1];
  const pause = getPauseAt(sub, today);

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
    cancellationNoticeDays: String(sub.cancellationNoticeMonths ?? sub.cancellationNoticeDays),
    noticeUnit: sub.cancellationNoticeMonths !== undefined ? 'months' : 'days',
    noticeToMonthEnd: sub.noticeToMonthEnd ?? false,
    renewalType: sub.renewal?.type ?? 'flexible',
    renewalMonths: sub.renewal?.type === 'fixed' ? String(sub.renewal.months) : '12',
    currency: current?.currency ?? fallbackCurrency,
    intervals,
    notes: sub.notes ?? '',
    isTrial: sub.trialEndsAt !== undefined,
    trialEndsAt: sub.trialEndsAt ?? '',
    // Ältere, einfach deaktivierte Abos erscheinen als "gekündigt, bereits beendet".
    isCancelled: !sub.isActive || sub.endsOn !== undefined,
    endsOn: sub.endsOn ?? '',
    isShared: sub.split !== undefined,
    splitType: sub.split?.type ?? 'equal',
    splitPeople: sub.split?.type === 'equal' ? String(sub.split.people) : '2',
    splitAmount: sub.split?.type === 'fixed' ? formatAmountInput(sub.split.amount) : '',
    isPaused: pause !== undefined,
    pausedUntil: pause?.endDate ?? '',
    pauses: sub.pauses ?? [],
    minimumCommitmentUntil: sub.minimumCommitmentUntil ?? '',
  };
}

function draftToSplit(draft: SubscriptionDraft): CostSplit | undefined {
  if (!draft.isShared) return undefined;
  return draft.splitType === 'equal'
    ? { type: 'equal', people: Number.parseInt(draft.splitPeople, 10) }
    : { type: 'fixed', amount: parseAmount(draft.splitAmount) ?? 0 };
}

/** Frist in Tagen oder Monaten – die jeweils andere Angabe entfällt. */
function draftToNotice(
  draft: SubscriptionDraft,
): Pick<Subscription, 'cancellationNoticeDays' | 'cancellationNoticeMonths' | 'noticeToMonthEnd'> {
  const value = Number.parseInt(draft.cancellationNoticeDays, 10) || 0;
  const inMonths = draft.noticeUnit === 'months' && value > 0;
  return {
    cancellationNoticeDays: inMonths ? 0 : value,
    cancellationNoticeMonths: inMonths ? value : undefined,
    noticeToMonthEnd: draft.noticeToMonthEnd || undefined,
  };
}

/** Setzt einen gültigen Entwurf (siehe validateDraft) in ein speicherbares Abo um. */
export function draftToSubscription(draft: SubscriptionDraft, today: Date = new Date()): Subscription {
  const optional = (value: string): string | undefined => (value.trim() === '' ? undefined : value.trim());

  const subscription: Subscription = {
    id: draft.id,
    name: draft.name.trim(),
    planName: optional(draft.planName),
    categoryId: draft.categoryId,
    paymentMethod: draft.paymentMethod.trim(),
    logoUrl: optional(draft.logoUrl),
    logoShape: draft.logoShape,
    billingCycle: draft.billingCycle,
    firstBillingDate: draft.firstBillingDate,
    ...draftToNotice(draft),
    renewal:
      draft.renewalType === 'fixed' ? { type: 'fixed', months: Number.parseInt(draft.renewalMonths, 10) } : undefined,
    intervals: sortByStart(draft.intervals).map((interval) => ({
      id: interval.id,
      startDate: interval.startDate,
      endDate: interval.endDate === '' ? null : interval.endDate,
      amount: parseAmount(interval.amount) ?? 0,
      currency: interval.currency,
    })),
    // Gekündigt ohne Enddatum = bereits beendet; mit Enddatum läuft das Abo bis dahin weiter.
    isActive: !draft.isCancelled || draft.endsOn !== '',
    endsOn: draft.isCancelled ? optional(draft.endsOn) : undefined,
    trialEndsAt: draft.isTrial ? optional(draft.trialEndsAt) : undefined,
    notes: optional(draft.notes),
    split: draftToSplit(draft),
    pauses: draft.pauses,
    minimumCommitmentUntil: optional(draft.minimumCommitmentUntil),
    // Speichern zählt als bewusste Prüfung (Zombie-Erkennung).
    lastReviewedAt: toISODate(today),
  };

  // Pause fortschreiben: neue Pause ab heute, Ende anpassen oder laufende Pause beenden.
  const withPause =
    !draft.isCancelled && draft.isPaused
      ? pauseSubscription(subscription, draft.pausedUntil === '' ? null : draft.pausedUntil, today)
      : resumeSubscription(subscription, today);
  return { ...withPause, pauses: withPause.pauses?.length ? withPause.pauses : undefined };
}

// ─── Validierung ────────────────────────────────────────────────────────────

export function validateDraft(draft: SubscriptionDraft, today: Date = new Date()): DraftValidation {
  const fields: DraftValidation['fields'] = {};
  const intervals: DraftValidation['intervals'] = {};
  const flag = (id: string, field: IntervalField, message: string) => {
    const existing = intervals[id] ?? {};
    if (!existing[field]) intervals[id] = { ...existing, [field]: message };
  };

  if (!draft.name.trim()) fields.name = 'Bitte einen Namen eingeben.';
  if (!draft.categoryId) fields.categoryId = 'Bitte eine Kategorie wählen.';
  if (!isValidISODate(draft.firstBillingDate)) fields.firstBillingDate = 'Bitte ein gültiges Datum wählen.';
  if (!/^\d+$/.test(draft.cancellationNoticeDays.trim())) {
    fields.cancellationNoticeDays = draft.noticeUnit === 'months' ? 'Ganze Monate ab 0.' : 'Ganze Tage ab 0.';
  }
  if (draft.renewalType === 'fixed') {
    const months = Number(draft.renewalMonths.trim());
    if (!Number.isInteger(months) || months < 1 || months > 120) fields.renewalMonths = 'Zwischen 1 und 120 Monaten.';
  }
  if (draft.intervals.length === 0) fields.intervals = 'Mindestens ein Preis ist nötig.';

  if (draft.isShared && draft.splitType === 'equal') {
    const people = Number(draft.splitPeople.trim());
    if (!Number.isInteger(people) || people < 2 || people > 99) fields.splitPeople = 'Zwischen 2 und 99 Personen.';
  }
  if (draft.isShared && draft.splitType === 'fixed') {
    const share = parseAmount(draft.splitAmount);
    const price = parseAmount(draft.intervals.find((i) => i.endDate === '')?.amount ?? '');
    if (share === null || share <= 0) fields.splitAmount = 'Betrag grösser als 0.';
    else if (price !== null && share > price) fields.splitAmount = 'Höher als der Gesamtpreis.';
  }
  if (draft.minimumCommitmentUntil !== '') {
    if (!isValidISODate(draft.minimumCommitmentUntil)) fields.minimumCommitmentUntil = 'Ungültiges Datum.';
    else if (draft.minimumCommitmentUntil < draft.firstBillingDate) {
      fields.minimumCommitmentUntil = 'Liegt vor der ersten Abbuchung.';
    }
  }
  if (draft.isTrial && !isValidISODate(draft.trialEndsAt)) fields.trialEndsAt = 'Bitte das Ende der Testphase wählen.';
  if (draft.isCancelled && draft.endsOn !== '' && !isValidISODate(draft.endsOn)) fields.endsOn = 'Ungültiges Datum.';
  if (!draft.isCancelled && draft.isPaused && draft.pausedUntil !== '') {
    if (!isValidISODate(draft.pausedUntil)) fields.pausedUntil = 'Ungültiges Datum.';
    else if (draft.pausedUntil < toISODate(today)) fields.pausedUntil = 'Liegt in der Vergangenheit.';
  }

  const sorted = sortByStart(draft.intervals);
  sorted.forEach((interval, index) => {
    const hasStart = isValidISODate(interval.startDate);
    if (!hasStart) flag(interval.id, 'startDate', 'Startdatum fehlt.');

    if (interval.endDate !== '') {
      if (!isValidISODate(interval.endDate)) flag(interval.id, 'endDate', 'Ungültiges Datum.');
      else if (hasStart && interval.endDate < interval.startDate) flag(interval.id, 'endDate', 'Liegt vor dem Start.');
    }

    const amount = parseAmount(interval.amount);
    if (amount === null) flag(interval.id, 'amount', 'Betrag ab 0 (0 = gratis).');
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

/**
 * Kopie als neues, noch nicht gespeichertes Abo: neue IDs, ohne Pausen, Kündigung und
 * Prüfdatum – Dokumente bleiben beim Original.
 */
export function duplicateDraft(draft: SubscriptionDraft): SubscriptionDraft {
  return {
    ...draft,
    id: createId(),
    name: `${draft.name.trim()} (Kopie)`,
    intervals: draft.intervals.map((interval) => ({ ...interval, id: createId() })),
    isPaused: false,
    pausedUntil: '',
    pauses: [],
    isCancelled: false,
    endsOn: '',
  };
}

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
