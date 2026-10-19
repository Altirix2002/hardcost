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

export function formatRelativeDays(days: number): string {
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  if (days === -1) return 'gestern';
  return days > 0 ? `in ${days} Tagen` : `vor ${Math.abs(days)} Tagen`;
}
