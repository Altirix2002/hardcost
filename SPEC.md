\# Spezifikation: SubPulse (Abo- \& Kosten-Kontrolle)



\## 1. Ziel \& Kernarchitektur

Eine hochmoderne, datenschutzfreundliche Web-App / PWA zur Erfassung und Auswertung wiederkehrender Abonnements.

\- \*\*Local-First:\*\* Alle Daten verbleiben primär in IndexedDB (Dexie.js).

\- \*\*Offline-Fähig:\*\* Vollwertige PWA für iOS/Android (Home-Screen-Installation) und Desktop.

\- \*\*Historientreu:\*\* Preisänderungen überschreiben niemals historische Monatsausgaben, sondern werden als Zeitintervalle abgelegt.



\---



\## 2. Datenmodell (`src/types/index.ts`)



```typescript

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type LogoShape = 'circle' | 'squircle';



export interface PriceInterval {

&#x20; id: string;

&#x20; startDate: string; // ISO-Datum YYYY-MM-DD

&#x20; endDate: string | null; // null = aktuell gültiger Preis

&#x20; amount: number;

&#x20; currency: string;

}



export interface Subscription {

&#x20; id: string;

&#x20; name: string;

&#x20; planName?: string; // z.B. "Family 4K"

&#x20; categoryId: string;

&#x20; paymentMethod: string; // z.B. "Twint", "Kreditkarte"

&#x20; logoUrl?: string;

&#x20; logoShape: LogoShape;

&#x20; billingCycle: BillingCycle;

&#x20; firstBillingDate: string; // YYYY-MM-DD

&#x20; cancellationNoticeDays: number; // Kündigungsfrist in Tagen

&#x20; intervals: PriceInterval\[];

&#x20; isActive: boolean;

&#x20; notes?: string;

}



export interface Category {

&#x20; id: string;

&#x20; name: string;

&#x20; color: string; // Hex-Code oder Tailwind-Color-Token

&#x20; isCustom: boolean;

}



export interface UserSettings {

&#x20; baseCurrency: string; // Standard z.B. "CHF" oder "EUR"

&#x20; theme: 'light' | 'dark' | 'system';

}

