// ─── Kern-Datenmodell (gemäss SPEC.md) ──────────────────────────────────────

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type LogoShape = 'circle' | 'squircle';

export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Tailwind-Farbtokens für Kategorien. Bewusst als Token statt Hex-Code,
 * damit Farben ohne Inline-Styles über Utility-Classes gerendert werden.
 */
export type CategoryColor =
  | 'rose'
  | 'orange'
  | 'amber'
  | 'lime'
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'indigo'
  | 'violet'
  | 'fuchsia'
  | 'slate';

export interface PriceInterval {
  id: string;
  startDate: string; // ISO-Datum YYYY-MM-DD
  endDate: string | null; // null = aktuell gültiger Preis
  amount: number;
  currency: string;
}

export interface Subscription {
  id: string;
  name: string;
  planName?: string; // z.B. "Family 4K"
  categoryId: string;
  paymentMethod: string; // z.B. "Twint", "Kreditkarte"
  logoUrl?: string;
  logoShape: LogoShape;
  billingCycle: BillingCycle;
  firstBillingDate: string; // YYYY-MM-DD
  cancellationNoticeDays: number; // Kündigungsfrist in Tagen
  intervals: PriceInterval[];
  isActive: boolean;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  isCustom: boolean;
}

export interface UserSettings {
  baseCurrency: string; // Standard z.B. "CHF" oder "EUR"
  theme: ThemePreference;
}

// ─── Persistenz (Dexie) ─────────────────────────────────────────────────────

/** Einzeiliger Settings-Datensatz in IndexedDB. */
export interface SettingsRecord extends UserSettings {
  id: 'user';
}

// ─── Währungen (Frankfurter API) ────────────────────────────────────────────

/** Rohantwort von https://api.frankfurter.dev/v1/latest */
export interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

/** Lokal gecachte Kurse, Schlüssel ist die Basiswährung. */
export interface ExchangeRates {
  base: string;
  date: string; // YYYY-MM-DD
  rates: Record<string, number>; // 1 base = x Zielwährung
  fetchedAt?: number; // Zeitpunkt des Abrufs (ms); fehlt bei älteren Cache-Einträgen
}

// ─── Formular-Entwürfe ──────────────────────────────────────────────────────

/** Eingabezustand eines Preisintervalls; Zahlen bleiben bis zum Speichern Strings. */
export interface PriceIntervalDraft {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // '' = aktuell gültig
  amount: string;
  currency: string;
}

/** Eingabezustand des Erfassungs-Modals. */
export interface SubscriptionDraft {
  id: string;
  name: string;
  planName: string;
  categoryId: string;
  paymentMethod: string;
  logoUrl: string; // '' = kein Logo
  logoShape: LogoShape;
  billingCycle: BillingCycle;
  firstBillingDate: string;
  cancellationNoticeDays: string;
  currency: string; // Standardwährung für neue Preisintervalle
  intervals: PriceIntervalDraft[];
  isActive: boolean;
  notes: string;
}

export type DraftField = 'name' | 'categoryId' | 'firstBillingDate' | 'cancellationNoticeDays' | 'intervals';

export type IntervalField = 'startDate' | 'endDate' | 'amount' | 'currency';

export type PriceIntervalPatch = Partial<Omit<PriceIntervalDraft, 'id'>>;

export interface DraftValidation {
  isValid: boolean;
  fields: Partial<Record<DraftField, string>>;
  intervals: Record<string, Partial<Record<IntervalField, string>>>; // Schlüssel: Intervall-ID
}

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

// ─── Abgeleitete Werte (Berechnungen) ───────────────────────────────────────

/** Eine konkrete, historientreue Abbuchung zu einem Datum. */
export interface Charge {
  subscriptionId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: string;
}

/** Laufende Kosten aller aktiven Abos in der Basiswährung. */
export interface CostSummary {
  monthly: number;
  yearly: number;
  activeCount: number;
  inactiveCount: number;
  /** Währungen aktiver Abos, für die (noch) kein Kurs vorliegt. */
  unconvertedCurrencies: string[];
}

/** Nächste noch einhaltbare Kündigungsfrist eines Abos. */
export interface CancellationWindow {
  deadline: Date; // letzter Tag zum Kündigen
  renewalDate: Date; // Abbuchung, die damit verhindert wird
  daysLeft: number;
}

export interface CancellationAlert {
  subscription: Subscription;
  window: CancellationWindow;
}

export interface UpcomingPayment {
  subscription: Subscription;
  date: Date;
  amount: number; // in Basiswährung
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export type SubscriptionSortKey = 'due' | 'cost' | 'name';

export type SubscriptionStatusFilter = 'all' | 'active' | 'inactive';
