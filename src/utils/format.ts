import type { BillingCycle } from '../types';

const LOCALE = 'de-CH';

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  quarterly: 'Quartalsweise',
  yearly: 'Jährlich',
};

export const BILLING_CYCLE_SUFFIX: Record<BillingCycle, string> = {
  weekly: '/Wo.',
  monthly: '/Mt.',
  quarterly: '/Qu.',
  yearly: '/J.',
};

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(amount);
}

export function formatDate(date: Date, withYear = false): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date);
}

export function formatMonthName(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long' }).format(date);
}

/** Kurzer Monatsname für Achsen, z.B. "Okt." */
export function formatShortMonth(year: number, month: number): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'short' }).format(new Date(year, month, 1));
}

export function formatMonthYear(year: number, month: number): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
}

/** Kompakte Achsenbeschriftung ohne Währungszeichen, z.B. "120" oder "1.2K". */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(share: number): string {
  return new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 }).format(share);
}

export function formatRelativeDays(days: number): string {
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  if (days === -1) return 'gestern';
  return days > 0 ? `in ${days} Tagen` : `vor ${Math.abs(days)} Tagen`;
}
