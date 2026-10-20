import type { BillingCycle, SelectOption, Subscription } from '../types';
import { BILLING_CYCLE_LABELS } from './format';

/** Von der Frankfurter API unterstützte Währungen, häufige zuerst. */
export const CURRENCIES = [
  'CHF', 'EUR', 'USD', 'GBP',
  'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'HKD', 'HUF', 'IDR', 'ILS', 'INR',
  'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'SEK',
  'SGD', 'THB', 'TRY', 'ZAR',
] as const;

const currencyNames = new Intl.DisplayNames('de-CH', { type: 'currency' });

/** Mit Namen, z.B. "CHF · Schweizer Franken". */
export const CURRENCY_OPTIONS: SelectOption[] = CURRENCIES.map((code) => ({
  value: code,
  label: `${code} · ${currencyNames.of(code) ?? code}`,
}));

/** Nur Codes, für schmale Felder. */
export const CURRENCY_CODE_OPTIONS: SelectOption[] = CURRENCIES.map((code) => ({ value: code, label: code }));

export function isSupportedCurrency(code: string): boolean {
  return (CURRENCIES as readonly string[]).includes(code);
}

export const BILLING_CYCLE_OPTIONS: SelectOption<BillingCycle>[] = (
  Object.keys(BILLING_CYCLE_LABELS) as BillingCycle[]
).map((cycle) => ({ value: cycle, label: BILLING_CYCLE_LABELS[cycle] }));

export const PAYMENT_METHOD_SUGGESTIONS = [
  'Kreditkarte',
  'Debitkarte',
  'Twint',
  'PayPal',
  'Apple Pay',
  'Google Pay',
  'Rechnung',
  'Lastschrift (LSV)',
] as const;

export function normalizePaymentMethod(method: string): string {
  return method.trim().toLocaleLowerCase('de-CH');
}

const DEFAULT_PAYMENT_KEYS = new Set<string>(PAYMENT_METHOD_SUGGESTIONS.map(normalizePaymentMethod));

export function isDefaultPaymentMethod(method: string): boolean {
  return DEFAULT_PAYMENT_KEYS.has(normalizePaymentMethod(method));
}

/** Selbst eingetragene Zahlungsarten aus den Abos, häufigste zuerst. */
export function getCustomPaymentMethods(subscriptions: Subscription[]): string[] {
  const custom = new Map<string, { label: string; count: number }>();
  for (const { paymentMethod } of subscriptions) {
    const label = paymentMethod.trim();
    if (!label || isDefaultPaymentMethod(label)) continue;
    const key = normalizePaymentMethod(label);
    const entry = custom.get(key);
    custom.set(key, { label: entry?.label ?? label, count: (entry?.count ?? 0) + 1 });
  }
  return [...custom.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'de-CH'))
    .map((entry) => entry.label);
}

/**
 * Vorschläge für die Zahlungsart: eigene (benutzte zuerst, dann gespeicherte) vor den Standardvorschlägen.
 * Gespeicherte bleiben erhalten, auch wenn das letzte Abo mit dieser Zahlungsart gelöscht wurde.
 */
export function getPaymentMethodSuggestions(subscriptions: Subscription[], saved: string[] = []): string[] {
  const own = [...getCustomPaymentMethods(subscriptions)];
  const keys = new Set(own.map(normalizePaymentMethod));
  for (const method of saved) {
    const key = normalizePaymentMethod(method);
    if (!method.trim() || keys.has(key) || isDefaultPaymentMethod(method)) continue;
    keys.add(key);
    own.push(method.trim());
  }
  return [...own, ...PAYMENT_METHOD_SUGGESTIONS];
}
