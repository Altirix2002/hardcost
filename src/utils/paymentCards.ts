import type { PaymentCard, PaymentCardAlert, PaymentCardKind, SelectOption, Subscription } from '../types';
import { getNextChargeDate } from './calculations';
import { daysBetween, startOfDay } from './dates';
import { normalizePaymentMethod } from './options';
import { isActiveAt } from './status';

/** Ab so vielen Tagen vor Kartenablauf warnt das Karten-Radar. */
export const CARD_EXPIRY_ALERT_DAYS = 30;
/** Abos auf virtuellen oder Einwegkarten: so viele Tage vor der Abbuchung warnen. */
export const CARD_RENEWAL_ALERT_DAYS = 7;

export const PAYMENT_CARD_KIND_LABELS: Record<PaymentCardKind, string> = {
  standard: 'Normale Karte',
  virtual: 'Virtuelle Karte',
  'single-use': 'Einwegkarte',
};

export const PAYMENT_CARD_KIND_OPTIONS: SelectOption<PaymentCardKind>[] = (
  Object.keys(PAYMENT_CARD_KIND_LABELS) as PaymentCardKind[]
).map((kind) => ({ value: kind, label: PAYMENT_CARD_KIND_LABELS[kind] }));

/** "08/27" oder "8/2027" → "2027-08"; null bei ungültiger Eingabe. */
export function parseCardExpiry(input: string): string | null {
  const [, monthPart, yearPart] = /^\s*(\d{1,2})\s*\/\s*(\d{2}|\d{4})\s*$/.exec(input) ?? [];
  if (!monthPart || !yearPart) return null;
  const month = Number(monthPart);
  if (month < 1 || month > 12) return null;
  const year = yearPart.length === 2 ? 2000 + Number(yearPart) : Number(yearPart);
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** "2027-08" → "08/27". */
export function formatCardExpiry(expiresAt: string): string {
  const [year = '', month = ''] = expiresAt.split('-');
  return `${month}/${year.slice(2)}`;
}

/** Karten gelten bis und mit dem letzten Tag des aufgedruckten Monats. */
export function getCardExpiryDate(card: PaymentCard): Date | null {
  if (!card.expiresAt) return null;
  const [year = 0, month = 0] = card.expiresAt.split('-').map(Number);
  return new Date(year, month, 0);
}

export function findPaymentCard(cards: PaymentCard[] | undefined, method: string): PaymentCard | undefined {
  const key = normalizePaymentMethod(method);
  if (!key || !cards) return undefined;
  return cards.find((card) => normalizePaymentMethod(card.method) === key);
}

/**
 * Warnungen des Karten-Radars, dringendste zuerst:
 * - Karte läuft in höchstens 30 Tagen ab (oder ist abgelaufen) und noch aktive Abos buchen darüber ab
 * - Abo auf einer virtuellen oder Einwegkarte bucht in höchstens 7 Tagen ab (Karte aufladen/neu erstellen)
 */
export function getPaymentCardAlerts(
  subscriptions: Subscription[],
  cards: PaymentCard[] | undefined,
  reference: Date = new Date(),
): PaymentCardAlert[] {
  if (!cards?.length) return [];
  const today = startOfDay(reference);
  const alerts: PaymentCardAlert[] = [];

  for (const card of cards) {
    const key = normalizePaymentMethod(card.method);
    const charging = subscriptions
      .filter((sub) => isActiveAt(sub, today) && normalizePaymentMethod(sub.paymentMethod) === key)
      .flatMap((sub) => {
        const next = getNextChargeDate(sub, today);
        return next ? [{ sub, next }] : [];
      });
    if (charging.length === 0) continue;

    const expiry = getCardExpiryDate(card);
    const expiryDays = expiry ? daysBetween(today, expiry) : null;
    if (expiry && expiryDays !== null && expiryDays <= CARD_EXPIRY_ALERT_DAYS) {
      alerts.push({
        card,
        reason: expiryDays < 0 ? 'expired' : 'expiring',
        daysLeft: expiryDays,
        date: expiry,
        subscriptions: charging.map(({ sub }) => sub),
      });
    }
    // Abgelaufene Karte: Die Ablauf-Warnung sagt schon alles.
    if (card.kind === 'standard' || (expiryDays !== null && expiryDays < 0)) continue;

    for (const { sub, next } of charging) {
      const daysLeft = daysBetween(today, next);
      if (daysLeft <= CARD_RENEWAL_ALERT_DAYS) {
        alerts.push({ card, reason: 'renewal', daysLeft, date: next, subscriptions: [sub] });
      }
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}
