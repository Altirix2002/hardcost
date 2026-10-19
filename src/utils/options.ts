import type { BillingCycle, SelectOption } from '../types';
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
