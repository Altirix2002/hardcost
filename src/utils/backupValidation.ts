import type { BackupFile, Category, CostSplit, PausePeriod, PriceInterval, Subscription, UserSettings } from '../types';
import { isCategoryColor } from './categoryStyles';
import { isSupportedCurrency } from './options';
import { isValidISODate } from './subscriptionDraft';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';
const isOptionalString = (value: unknown): value is string | undefined => value === undefined || isString(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isDate = (value: unknown): value is string => isString(value) && isValidISODate(value);
const isCurrencyCode = (value: unknown): value is string => isString(value) && /^[A-Z]{3}$/.test(value);

function isPriceInterval(value: unknown): value is PriceInterval {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isDate(value.startDate) &&
    (value.endDate === null || isDate(value.endDate)) &&
    isFiniteNumber(value.amount) &&
    value.amount >= 0 &&
    isCurrencyCode(value.currency)
  );
}

function isPausePeriod(value: unknown): value is PausePeriod {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isDate(value.startDate) &&
    (value.endDate === null || isDate(value.endDate))
  );
}

function isCostSplit(value: unknown): value is CostSplit {
  if (!isRecord(value)) return false;
  if (value.type === 'equal') return Number.isInteger(value.people) && (value.people as number) >= 2;
  return value.type === 'fixed' && isFiniteNumber(value.amount) && value.amount > 0;
}

function isSubscription(value: unknown): value is Subscription {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isOptionalString(value.planName) &&
    isString(value.categoryId) &&
    isString(value.paymentMethod) &&
    isOptionalString(value.logoUrl) &&
    (value.logoShape === 'circle' || value.logoShape === 'squircle') &&
    ['weekly', 'monthly', 'quarterly', 'yearly'].includes(value.billingCycle as string) &&
    isDate(value.firstBillingDate) &&
    isFiniteNumber(value.cancellationNoticeDays) &&
    value.cancellationNoticeDays >= 0 &&
    Array.isArray(value.intervals) &&
    value.intervals.every(isPriceInterval) &&
    typeof value.isActive === 'boolean' &&
    isOptionalString(value.notes) &&
    (value.split === undefined || isCostSplit(value.split)) &&
    (value.pauses === undefined || (Array.isArray(value.pauses) && value.pauses.every(isPausePeriod)))
  );
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isCategoryColor(value.color) &&
    typeof value.isCustom === 'boolean'
  );
}

function isUserSettings(value: unknown): value is UserSettings {
  return (
    isRecord(value) &&
    isString(value.baseCurrency) &&
    isSupportedCurrency(value.baseCurrency) &&
    (value.theme === 'light' || value.theme === 'dark' || value.theme === 'system')
  );
}

/** Prüft eine eingelesene Backup-Datei vollständig; wirft einen verständlichen Fehler bei Problemen. */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.');
  }

  if (!isRecord(data) || data.app !== 'subpulse') throw new Error('Das ist keine SubPulse-Sicherung.');
  if (data.version !== 1) throw new Error(`Backup-Version ${String(data.version)} wird nicht unterstützt.`);
  if (!isString(data.exportedAt)) throw new Error('Dem Backup fehlt das Exportdatum.');
  if (!isUserSettings(data.settings)) throw new Error('Die Einstellungen im Backup sind ungültig.');
  if (!Array.isArray(data.categories) || !Array.isArray(data.subscriptions)) {
    throw new Error('Dem Backup fehlen Abos oder Kategorien.');
  }

  const badCategory = data.categories.findIndex((c) => !isCategory(c));
  if (badCategory !== -1) throw new Error(`Kategorie Nr. ${badCategory + 1} im Backup ist ungültig.`);
  const badSubscription = data.subscriptions.findIndex((s) => !isSubscription(s));
  if (badSubscription !== -1) throw new Error(`Abo Nr. ${badSubscription + 1} im Backup ist ungültig.`);

  return {
    app: 'subpulse',
    version: 1,
    exportedAt: data.exportedAt,
    settings: data.settings,
    categories: data.categories.filter(isCategory),
    subscriptions: data.subscriptions.filter(isSubscription),
  };
}
