import Dexie, { type EntityTable } from 'dexie';
import type { Category, ExchangeRates, SettingsRecord, StoredDocument, Subscription } from '../types';
import { toISODate } from '../utils/dates';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './seed';

type SubPulseDatabase = Dexie & {
  subscriptions: EntityTable<Subscription, 'id'>;
  categories: EntityTable<Category, 'id'>;
  settings: EntityTable<SettingsRecord, 'id'>;
  exchangeRates: EntityTable<ExchangeRates, 'base'>;
  documents: EntityTable<StoredDocument, 'id'>;
};

export const db = new Dexie('subpulse') as SubPulseDatabase;

db.version(1).stores({
  subscriptions: 'id, categoryId, billingCycle, name',
  categories: 'id, name',
  settings: 'id',
  exchangeRates: 'base',
});

// v2: Zombie-Erkennung. Bestehende Abos hatten kein Erfassungsdatum – sie gelten als heute geprüft,
// sonst wären nach dem Update alle älteren Verträge auf einen Schlag als "vergessen" markiert.
db.version(2)
  .stores({})
  .upgrade(async (tx) => {
    const today = toISODate(new Date());
    await tx
      .table<Subscription, string>('subscriptions')
      .toCollection()
      .modify((sub) => {
        sub.lastReviewedAt ??= today;
      });
  });

// v3: Lokale Dokumenten-Ablage (Verträge, Rechnungen) als Blobs.
db.version(3).stores({
  documents: 'id, subscriptionId, createdAt',
});

// v4: Gekündigt-Status. Früher einfach deaktivierte Abos erhalten das Ende ihres letzten Preises als
// Vertragsende – die Karte zeigt dann "Gekündigt · beendet am …" statt nur "Inaktiv".
db.version(4)
  .stores({})
  .upgrade(async (tx) => {
    await tx
      .table<Subscription, string>('subscriptions')
      .toCollection()
      .modify((sub) => {
        if (sub.isActive || sub.endsOn) return;
        const ends = sub.intervals.map((i) => i.endDate).filter((date): date is string => date !== null);
        if (ends.length === sub.intervals.length && ends.length > 0) sub.endsOn = ends.sort().at(-1);
      });
  });

// Wird nur beim allerersten Anlegen der Datenbank ausgeführt.
db.on('populate', async (tx) => {
  await tx.table<Category, string>('categories').bulkAdd(DEFAULT_CATEGORIES);
  await tx.table<SettingsRecord, string>('settings').add({ id: 'user', ...DEFAULT_SETTINGS });
});
