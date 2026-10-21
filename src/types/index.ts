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

/**
 * Anschlussregel nach der Mindestlaufzeit:
 * - flexible: vor jeder Abbuchung kündbar (z.B. monatlich kündbar nach deutschem Recht)
 * - fixed: verlängert sich jeweils um `months` Monate, kündbar nur auf das Ende dieser Laufzeit
 */
export type ContractRenewal = { type: 'flexible' } | { type: 'fixed'; months: number };

export type ContractRenewalType = ContractRenewal['type'];

export type NoticeUnit = 'days' | 'months';

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
  /** Kündigungsfrist in Monaten (z.B. "3 Monate"); hat Vorrang vor `cancellationNoticeDays`. */
  cancellationNoticeMonths?: number;
  /** Kündigung nur auf ein Monatsende möglich ("1 Monat auf Monatsende"). */
  noticeToMonthEnd?: boolean;
  /** Was nach der Mindestlaufzeit gilt; fehlt = flexibel kündbar. */
  renewal?: ContractRenewal;
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
  /** Aus dem Logo bestimmte Markenfarben (Glas-Glow, Akzentlinie); fehlt = noch nicht bestimmt bzw. kein Logo. */
  brandColors?: BrandColors;
  /** Position in der eigenen Reihenfolge (aufsteigend); fehlt = noch nie angeordnet. */
  sortOrder?: number;
}

/** Dominante Farben eines Logos als Hex (#rrggbb); als Kartenfarbe auch eine CSS-Farbe (Kategorie). */
export interface BrandColors {
  primary: string;
  secondary: string;
}

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  isCustom: boolean;
  /** Monatliche Obergrenze (Abo-Deckel) in der Basiswährung; fehlt = kein Limit. */
  monthlyBudget?: number;
}

// ─── Bezahlkarten ───────────────────────────────────────────────────────────

/**
 * - standard: normale Kredit-/Debitkarte – Warnung vor dem Ablauf
 * - virtual: virtuelle (Prepaid-)Karte – Warnung vor Ablauf und vor jeder Abbuchung
 * - single-use: Einwegkarte – nach einer Zahlung verbraucht, Warnung vor jeder Verlängerung
 */
export type PaymentCardKind = 'standard' | 'virtual' | 'single-use';

/** Details zu einer Zahlungsart. Nie die Kartennummer – höchstens die letzten 4 Ziffern. */
export interface PaymentCard {
  /** Zahlungsart, wie sie im Abo steht (Verknüpfung, Gross-/Kleinschreibung egal). */
  method: string;
  kind: PaymentCardKind;
  expiresAt?: string; // YYYY-MM, letzter gültiger Monat
  lastFour?: string;
}

export type PaymentCardAlertReason = 'expired' | 'expiring' | 'renewal';

/** Warnung des Karten-Radars: Karte läuft ab oder ein Abo auf einer Wegwerfkarte verlängert sich. */
export interface PaymentCardAlert {
  card: PaymentCard;
  reason: PaymentCardAlertReason;
  /** Tage bis Kartenablauf bzw. bis zur Abbuchung (negativ = schon abgelaufen). */
  daysLeft: number;
  date: Date; // Ablauf (letzter Tag des Monats) bzw. Abbuchungstermin
  /** Betroffene aktive Abos (bei 'renewal' genau eines). */
  subscriptions: Subscription[];
}

// ─── Budgets & Fixkosten-Quote ──────────────────────────────────────────────

/** Ampel der Kategorie-Budgets: ab 80 % gelb, ab 95 % orange, über 100 % harter Alarm. */
export type CategoryBudgetLevel = 'ok' | 'notice' | 'warning' | 'over';

export interface CategoryBudgetStatus {
  category: Category;
  budget: number; // in Basiswährung
  monthly: number; // Durchschnittskosten pro Monat in Basiswährung
  share: number; // 0–∞
  level: CategoryBudgetLevel;
}

export type CostRatioLevel = 'green' | 'yellow' | 'red';

/** Grenzen der Ampel als Anteil am Nettoeinkommen (0.1 = 10 %). */
export interface CostRatioThresholds {
  green: number; // bis hier grün
  yellow: number; // bis hier gelb, darüber rot
}

export interface CostRatio {
  ratio: number; // Fixkosten / Nettoeinkommen
  level: CostRatioLevel;
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
  /** Kartendetails (Ablauf, Einweg-/virtuelle Karte) zu Zahlungsarten. */
  paymentCards?: PaymentCard[];
  /** Monatliches Nettoeinkommen in der Basiswährung – für die Fixkosten-Quote. */
  netIncome?: number;
  /** Eigene Ampel-Grenzen der Fixkosten-Quote; fehlt = Standard (10 % / 20 %). */
  costRatioThresholds?: CostRatioThresholds;
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
  cancellationNoticeDays: string; // Wert der Frist, Einheit in `noticeUnit`
  noticeUnit: NoticeUnit;
  noticeToMonthEnd: boolean;
  renewalType: ContractRenewalType;
  renewalMonths: string;
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
  | 'renewalMonths'
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
  /** Wird die Frist verpasst, verlängert sich der Vertrag um so viele Monate; fehlt = nur bis zur nächsten Abbuchung. */
  renewsForMonths?: number;
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

/** Detail- und Vertragsdaten für die Rückseite einer Abo-Karte. */
export interface SubscriptionFacts {
  /** Nächste tatsächliche Abbuchung (eigener Anteil, Originalwährung); null = keine anstehend. */
  nextCharge: { date: Date; amount: number; currency: string } | null;
  /** Spätester Kündigungstag für die nächste verhinderbare Abbuchung; null = keine Frist. */
  cancelBy: Date | null;
  /** Ende der Bindung (Mindest- oder feste Anschlusslaufzeit); null = flexibel. */
  boundUntil: Date | null;
  /** Feste Verlängerung in Monaten; fehlt = flexibel kündbar. */
  renewsForMonths?: number;
  paymentMethod: string;
  card?: PaymentCard;
  paidTotal: number; // bisher bezahlt, Basiswährung
  since: Date; // erste Abbuchung
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

/** 'manual' = eigene Reihenfolge (per Drag & Drop, gilt für Liste und Kacheln). */
export type SubscriptionSortKey = 'due' | 'cost' | 'name' | 'manual';

/** Darstellung der Abo-Liste: grosse Karten oder kompakte Kacheln (mehr Abos auf einen Blick). */
export type SubscriptionViewMode = 'list' | 'tiles';

export type SubscriptionStatusFilter = 'all' | 'active' | 'paused' | 'cancelled';

/** 'subscriptions' = nur die Abo-Liste, ohne Kennzahlen und Hinweise der Übersicht. */
export type AppTab = 'overview' | 'subscriptions' | 'statistics' | 'archive';

// ─── Abo-Friedhof ───────────────────────────────────────────────────────────

export interface ArchiveEntry {
  subscription: Subscription;
  endedOn: Date | null; // letzter Vertragstag; null = unbekannt (ältere Daten)
  /** Letzter eigener Preis als Monatsäquivalent in Basiswährung. */
  monthly: number;
  /** Seit dem Ende real gespart (Abbuchungen, die zum letzten Preis angefallen wären). */
  saved: number;
}

export interface ArchiveSummary {
  entries: ArchiveEntry[];
  totalSaved: number;
  monthlySaved: number;
}

// ─── Logos ──────────────────────────────────────────────────────────────────

/** Treffer aus dem Simple-Icons-Katalog (einfarbige Marken-Icons). */
export interface BrandIcon {
  slug: string;
  title: string;
  hex: string; // Markenfarbe ohne #, z.B. "E50914"
}

/** Treffer der Brandfetch-Suche; das Logo wird per Hotlink vom Brandfetch-CDN geladen. */
export interface BrandfetchMatch {
  name: string;
  domain: string;
  iconUrl: string;
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
  /** Darf nur per Hotlink genutzt werden (Brandfetch): direkt übernehmen, ohne Zuschnitt. */
  hotlink?: boolean;
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
  app: 'hardcost';
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

// ─── Geräte-Sync (WebRTC) ───────────────────────────────────────────────────

/** Aus Sicht des Geräts, das die Verbindung startet: sendet es seine Daten oder holt es sie? */
export type SyncDirection = 'send' | 'receive';

export interface SyncSignalCandidate {
  ip: string; // IP oder mDNS-Name (xyz.local)
  port: number;
  type: string; // host, srflx, …
  priority: number;
}

/** Inhalt eines Sync-QR-Codes: das Nötigste aus dem SDP-Angebot bzw. der Antwort. */
export interface SyncSignal {
  kind: 'offer' | 'answer';
  direction: SyncDirection;
  ufrag: string;
  pwd: string;
  fingerprint: string; // SHA-256, Hex mit Doppelpunkten
  candidates: SyncSignalCandidate[];
}

/** Ablauf des Sync-Assistenten in den Einstellungen. */
export type SyncStage =
  | { step: 'idle' }
  | { step: 'preparing' }
  /** Startgerät zeigt sein Angebot … */
  | { step: 'show-offer'; code: string; direction: SyncDirection }
  /** … und scannt danach die Antwort. */
  | { step: 'scan-answer' }
  /** Zweitgerät scannt das Angebot … */
  | { step: 'scan-offer' }
  /** … und zeigt seine Antwort, bis die Verbindung steht. */
  | { step: 'show-answer'; code: string; receiving: boolean }
  | { step: 'connecting' }
  | { step: 'transfer'; receiving: boolean; progress: number }
  /** Empfänger: Übernahme bestätigen (ersetzt alle Daten hier). */
  | { step: 'confirm'; subscriptions: number; documents: number }
  | { step: 'done'; message: string }
  | { step: 'error'; message: string };

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

/** Kennzahlen für "HardCost Wrapped" über die letzten 12 Monate. */
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
