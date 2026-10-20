// ─── Kern-Datenmodell (gemäss SPEC.md) ──────────────────────────────────────

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type LogoShape = 'circle' | 'squircle';

export type ThemePreference = 'light' | 'dark' | 'system';

/** Tailwind-Farbtöne, in Regenbogen-Reihenfolge. */
export type CategoryHue =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'slate'
  | 'stone';

export type CategoryTone = 'light' | 'base' | 'dark';

/**
 * Tailwind-Farbtokens für Kategorien, z.B. "sky" (normal), "sky-light" oder "sky-dark".
 * Bewusst als Token statt Hex-Code, damit Farben ohne Inline-Styles über Utility-Classes
 * gerendert werden. Ältere Daten mit reinem Farbton bleiben so gültig.
 */
export type CategoryColor = CategoryHue | `${CategoryHue}-light` | `${CategoryHue}-dark`;

export interface PriceInterval {
  id: string;
  startDate: string; // ISO-Datum YYYY-MM-DD
  endDate: string | null; // null = aktuell gültiger Preis
  amount: number;
  currency: string;
}

/** Zeitraum, in dem ein Abo pausiert ist (Schlummer-Modus) – Abbuchungen darin entfallen. */
export interface PausePeriod {
  id: string;
  startDate: string; // YYYY-MM-DD, erster pausierter Tag
  endDate: string | null; // letzter pausierter Tag; null = unbefristet
}

/**
 * Kosten-Splitting: Nur der eigene Anteil zählt.
 * - equal: Preis gleichmässig auf `people` Personen (inkl. dir) verteilt – folgt Preisänderungen.
 * - fixed: fester Betrag pro Abrechnung in der Währung des jeweiligen Preises.
 */
export type CostSplit = { type: 'equal'; people: number } | { type: 'fixed'; amount: number };

export type CostSplitType = CostSplit['type'];

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
  /** Geteiltes Abo; fehlt = du zahlst alles. */
  split?: CostSplit;
  /** Pausen-Historie; fehlt bei älteren Daten. */
  pauses?: PausePeriod[];
  /** Mindestlaufzeit (Vertragsbindung): Abbuchungen bis und mit diesem Tag sind nicht kündbar. */
  minimumCommitmentUntil?: string; // YYYY-MM-DD
  /** Wann das Abo zuletzt bewusst geprüft bzw. bearbeitet wurde (Zombie-Erkennung). */
  lastReviewedAt?: string; // YYYY-MM-DD
  /** Gratis-Testphase: letzter kostenloser Tag – Abbuchungen bis dahin entfallen. */
  trialEndsAt?: string; // YYYY-MM-DD
  /** Gekündigt: letzter Tag, an dem das Abo noch läuft – danach keine Abbuchungen mehr. */
  endsOn?: string; // YYYY-MM-DD
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
  /** Selbst eingetragene Zahlungsarten – bleiben erhalten, auch wenn kein Abo sie mehr nutzt. */
  paymentMethods?: string[];
  /** Monatliches Budget in der Basiswährung; fehlt = kein Budget. */
  monthlyBudget?: number;
  /** Zeitpunkt des letzten Backups (ISO); fehlt = noch nie gesichert. */
  lastBackupAt?: string;
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
  notes: string;
  isTrial: boolean;
  trialEndsAt: string;
  /** Gekündigt; ohne `endsOn` gilt das Abo als bereits beendet (inaktiv). */
  isCancelled: boolean;
  endsOn: string;
  isShared: boolean;
  splitType: CostSplitType;
  splitPeople: string; // Anzahl Personen inkl. dir
  splitAmount: string; // eigener Betrag pro Abrechnung
  isPaused: boolean;
  pausedUntil: string; // '' = unbefristet
  minimumCommitmentUntil: string; // '' = keine Mindestlaufzeit
  /** Bestehende Pausen-Historie, wird beim Speichern fortgeschrieben. */
  pauses: PausePeriod[];
}

export type DraftField =
  | 'name'
  | 'categoryId'
  | 'firstBillingDate'
  | 'cancellationNoticeDays'
  | 'intervals'
  | 'splitPeople'
  | 'splitAmount'
  | 'pausedUntil'
  | 'minimumCommitmentUntil'
  | 'trialEndsAt'
  | 'endsOn';

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
  activeCount: number; // aktiv und nicht pausiert
  pausedCount: number;
  inactiveCount: number;
  /** Währungen aktiver Abos, für die (noch) kein Kurs vorliegt. */
  unconvertedCurrencies: string[];
}

/** Nächste noch einhaltbare Kündigungsfrist eines Abos. */
export interface CancellationWindow {
  deadline: Date; // letzter Tag zum Kündigen
  renewalDate: Date; // Abbuchung, die damit verhindert wird
  daysLeft: number;
  /** Die Frist beendet gleichzeitig die Mindestlaufzeit. */
  endsCommitment: boolean;
  /** Die Frist ist das Ende einer Gratis-Testphase. */
  endsTrial: boolean;
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

/** Eine künftige Abbuchung mit Originalbetrag (für Fremdwährungen). */
export interface UpcomingCharge extends UpcomingPayment {
  originalAmount: number;
  currency: string;
}

export interface UpcomingChargeMonth {
  year: number;
  month: number; // 0–11
  total: number; // in Basiswährung
  charges: UpcomingCharge[];
}

/** Zeitraum der Abbuchungsvorschau. */
export type UpcomingRange = 'month' | 'quarter' | 'year';

/** Tatsächliche Ausgaben eines Kalendermonats. */
export interface MonthlySpendPoint {
  year: number;
  month: number; // 0–11
  total: number; // in Basiswährung
}

/** Anteil einer Kategorie an den monatlichen Fixkosten. */
export interface CategoryShare {
  category: Category;
  monthly: number; // in Basiswährung
  share: number; // 0–1
  count: number;
}

export interface SubscriptionCost {
  subscription: Subscription;
  monthly: number; // in Basiswährung
}

/** Letzte (oder angekündigte) Preiserhöhung eines Abos – Beträge pro Abrechnung, Gesamttarif. */
export interface PriceHike {
  subscription: Subscription;
  previousAmount: number;
  currentAmount: number;
  currency: string;
  absoluteChange: number;
  percentageChange: number; // 0.167 = +16.7 %
  /** Mehrkosten pro Monat in Basiswährung (vergleichbar über Zyklen und Währungen). */
  monthlyIncrease: number;
  effectiveDate: string; // YYYY-MM-DD
  isUpcoming: boolean; // Preis gilt erst in Zukunft
}

/** Tatsächlich bezahlte Summe seit Vertragsbeginn (Einzelabbuchungen, eigener Anteil). */
export interface LifetimeCost {
  totalPaid: number; // in Basiswährung
  chargeCount: number;
  since: Date; // erste Abbuchung
  pausedDays: number; // pausierte Tage bis heute
  skippedCharges: number; // durch Pausen entfallene Abbuchungen
  savedByPauses: number; // deren Summe in Basiswährung
}

export type PriceHikeSortKey = 'absolute' | 'percent';

/** Monatliche Fixkosten je Zahlungsart. */
export interface PaymentMethodShare {
  method: string;
  monthly: number; // in Basiswährung
  share: number; // 0–1
  /** Ganzzahlige Prozente, die zusammen exakt 100 ergeben. */
  percent: number;
  subscriptions: SubscriptionCost[];
}

// ─── Dashboard & Navigation ─────────────────────────────────────────────────

export type SubscriptionSortKey = 'due' | 'cost' | 'name';

/** Darstellung der Abo-Liste: grosse Karten oder kompakte Kacheln (mehr Abos auf einen Blick). */
export type SubscriptionViewMode = 'list' | 'tiles';

export type SubscriptionStatusFilter = 'all' | 'active' | 'paused' | 'cancelled';

export type AppTab = 'overview' | 'statistics';

// ─── Logos ──────────────────────────────────────────────────────────────────

/** Treffer aus dem Simple-Icons-Katalog (einfarbige Marken-Icons). */
export interface BrandIcon {
  slug: string;
  title: string;
  hex: string; // Markenfarbe ohne #, z.B. "E50914"
}

/** Website-Treffer der Firmensuche; das Icon kommt vom Favicon-Dienst. */
export interface WebsiteMatch {
  name: string;
  domain: string;
}

/** Bild, das im Logo-Editor zugeschnitten wird. */
export interface LogoSource {
  src: string; // Data-, Blob- oder (CORS-fähige) Web-URL
  /** Einfarbiges Marken-Icon: wird auf farbigem Hintergrund weiss eingefärbt. */
  monochrome?: boolean;
  /** Markenfarbe als Hex (#RRGGBB) – wird als Hintergrund angeboten. */
  brandColor?: string;
}

/** Zuschnitt im Logo-Editor; Versatz relativ zur Kantenlänge (0 = zentriert). */
export interface LogoCrop {
  zoom: number; // 1 = Bild passt vollständig hinein
  offsetX: number;
  offsetY: number;
  background: string; // Hex-Farbe, z.B. "#ffffff"
}

// ─── Datensicherung ─────────────────────────────────────────────────────────

/** Format der JSON-Backups (Export/Import). */
export interface BackupFile {
  app: 'subpulse';
  version: 1;
  exportedAt: string; // ISO-Zeitstempel
  settings: UserSettings;
  categories: Category[];
  subscriptions: Subscription[];
  /** Nur im ZIP-Backup: Metadaten der Dokumente, die Dateien liegen unter `path` im Archiv. */
  documents?: BackupDocument[];
}

export interface BackupDocument extends Omit<StoredDocument, 'blob'> {
  path: string; // z.B. "documents/<id>-vertrag.pdf"
}

/** Eingelesenes Backup; `documents` ist null bei reinen JSON-Backups (bestehende Dokumente bleiben). */
export interface ParsedBackup {
  backup: BackupFile;
  documents: StoredDocument[] | null;
}

// ─── Dokumente (lokal in IndexedDB) ─────────────────────────────────────────

export type DocumentMimeType = 'application/pdf' | 'image/png' | 'image/jpeg';

/** Vertrag, Rechnung oder Kündigungsbestätigung – als Blob direkt in IndexedDB. */
export interface StoredDocument {
  id: string;
  subscriptionId: string;
  fileName: string;
  fileType: DocumentMimeType;
  fileSize: number; // Bytes
  blob: Blob;
  createdAt: string; // ISO-Zeitstempel
}

// ─── App-Sperre ─────────────────────────────────────────────────────────────

/** Lokal gespeicherte Sperr-Konfiguration (localStorage); der PIN nur als gesalzener Hash. */
export interface AppLockConfig {
  enabled: boolean;
  pinHash: string; // hex, SHA-256 über Salt + PIN
  pinSalt: string; // hex
  /** WebAuthn-Credential (base64url) für Face ID / Touch ID / Windows Hello; fehlt = nur PIN. */
  credentialId?: string;
}

// ─── Spar-Simulator & Jahresrückblick ───────────────────────────────────────

export interface SavingsSimulation {
  currentMonthly: number; // in Basiswährung
  newMonthly: number;
  savedMonthly: number;
  savedYearly: number;
  savedThreeYears: number;
  reduction: number; // 0–1
}

/** Kennzahlen für "SubPulse Wrapped" über die letzten 12 Monate. */
export interface WrappedSummary {
  periodStart: Date;
  periodEnd: Date;
  totalSpent: number; // in Basiswährung
  chargeCount: number;
  subscriptionCount: number; // Abos mit mindestens einer Abbuchung
  topSubscription: { subscription: Subscription; total: number } | null; // Summe im Zeitraum
  biggestHike: PriceHike | null;
  savedByPauses: number;
  savedByCancellations: number;
}

// ─── Statusmeldungen (Dynamic Island) ───────────────────────────────────────

export type ToastKind = 'success' | 'paused' | 'resumed' | 'deleted' | 'info';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}
