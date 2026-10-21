import type {
  BackupDocument,
  BackupFile,
  Category,
  CostRatioThresholds,
  CostSplit,
  PausePeriod,
  PaymentCard,
  PriceInterval,
  Subscription,
  UserSettings,
} from '../types';
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

function isContractRenewal(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return value.type === 'flexible' || (value.type === 'fixed' && isFiniteNumber(value.months) && value.months > 0);
}

const isHexColor = (value: unknown): value is string => isString(value) && /^#[0-9a-f]{6}$/i.test(value);

function isBrandColors(value: unknown): boolean {
  return isRecord(value) && isHexColor(value.primary) && isHexColor(value.secondary);
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
    (value.cancellationNoticeMonths === undefined || isFiniteNumber(value.cancellationNoticeMonths)) &&
    (value.noticeToMonthEnd === undefined || typeof value.noticeToMonthEnd === 'boolean') &&
    (value.renewal === undefined || isContractRenewal(value.renewal)) &&
    Array.isArray(value.intervals) &&
    value.intervals.every(isPriceInterval) &&
    typeof value.isActive === 'boolean' &&
    isOptionalString(value.notes) &&
    (value.split === undefined || isCostSplit(value.split)) &&
    (value.pauses === undefined || (Array.isArray(value.pauses) && value.pauses.every(isPausePeriod))) &&
    (value.minimumCommitmentUntil === undefined || isDate(value.minimumCommitmentUntil)) &&
    (value.lastReviewedAt === undefined || isDate(value.lastReviewedAt)) &&
    (value.trialEndsAt === undefined || isDate(value.trialEndsAt)) &&
    (value.endsOn === undefined || isDate(value.endsOn)) &&
    (value.brandColors === undefined || isBrandColors(value.brandColors))
  );
}

function isBackupDocument(value: unknown): value is BackupDocument {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.subscriptionId) &&
    isString(value.fileName) &&
    (value.fileType === 'application/pdf' || value.fileType === 'image/png' || value.fileType === 'image/jpeg') &&
    isFiniteNumber(value.fileSize) &&
    isString(value.createdAt) &&
    isString(value.path) &&
    value.path.startsWith('documents/')
  );
}

const isPositiveNumber = (value: unknown): value is number => isFiniteNumber(value) && value > 0;

function isPaymentCard(value: unknown): value is PaymentCard {
  return (
    isRecord(value) &&
    isString(value.method) &&
    (value.kind === 'standard' || value.kind === 'virtual' || value.kind === 'single-use') &&
    (value.expiresAt === undefined || (isString(value.expiresAt) && /^d{4}-(0[1-9]|1[0-2])$/.test(value.expiresAt))) &&
    (value.lastFour === undefined || (isString(value.lastFour) && /^d{4}$/.test(value.lastFour)))
  );
}

function isCostRatioThresholds(value: unknown): value is CostRatioThresholds {
  return (
    isRecord(value) &&
    isPositiveNumber(value.green) &&
    isPositiveNumber(value.yellow) &&
    value.green < value.yellow
  );
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isCategoryColor(value.color) &&
    typeof value.isCustom === 'boolean' &&
    (value.monthlyBudget === undefined || isPositiveNumber(value.monthlyBudget))
  );
}

function isUserSettings(value: unknown): value is UserSettings {
  return (
    isRecord(value) &&
    isString(value.baseCurrency) &&
    isSupportedCurrency(value.baseCurrency) &&
    (value.theme === 'light' || value.theme === 'dark' || value.theme === 'system') &&
    (value.paymentMethods === undefined ||
      (Array.isArray(value.paymentMethods) && value.paymentMethods.every(isString))) &&
    (value.monthlyBudget === undefined || isPositiveNumber(value.monthlyBudget)) &&
    (value.paymentCards === undefined || (Array.isArray(value.paymentCards) && value.paymentCards.every(isPaymentCard))) &&
    (value.netIncome === undefined || isPositiveNumber(value.netIncome)) &&
    (value.costRatioThresholds === undefined || isCostRatioThresholds(value.costRatioThresholds))
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

  // Sicherungen von vor dem Rebranding tragen noch "subpulse".
  if (!isRecord(data) || (data.app !== 'hardcost' && data.app !== 'subpulse')) {
    throw new Error('Das ist keine HardCost-Sicherung.');
  }
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

  if (data.documents !== undefined && (!Array.isArray(data.documents) || !data.documents.every(isBackupDocument))) {
    throw new Error('Die Dokumentenliste im Backup ist ungültig.');
  }

  return {
    app: 'hardcost',
    version: 1,
    exportedAt: data.exportedAt,
    settings: data.settings,
    categories: data.categories.filter(isCategory),
    subscriptions: data.subscriptions.filter(isSubscription),
    documents: Array.isArray(data.documents) ? data.documents.filter(isBackupDocument) : undefined,
  };
}
