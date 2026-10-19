import type { ExchangeRates, FrankfurterResponse } from '../types';

// api.frankfurter.app leitet per 301 ohne CORS-Header hierher um – daher direkt die neue Domain.
const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest';

function isFrankfurterResponse(value: unknown): value is FrankfurterResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.base === 'string' &&
    typeof v.date === 'string' &&
    typeof v.rates === 'object' &&
    v.rates !== null
  );
}

/** Lädt die aktuellen Wechselkurse relativ zur Basiswährung. */
export async function fetchLatestRates(base: string): Promise<ExchangeRates> {
  const response = await fetch(`${FRANKFURTER_URL}?from=${encodeURIComponent(base)}`);
  if (!response.ok) throw new Error(`Frankfurter API: HTTP ${response.status}`);

  const data: unknown = await response.json();
  if (!isFrankfurterResponse(data)) throw new Error('Frankfurter API: unerwartetes Antwortformat');

  return { base: data.base, date: data.date, rates: data.rates };
}
