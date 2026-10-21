import Dexie, { type EntityTable } from 'dexie';
import type { Category, ExchangeRates, SettingsRecord, StoredDocument, Subscription } from '../types';
import { toISODate } from '../utils/dates';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './seed';

type HardCostDatabase = Dexie & {
  subscriptions: EntityTable<Subscription, 'id'>;
  categories: EntityTable<Category, 'id'>;
  settings: EntityTable<SettingsRecord, 'id'>;
  exchangeRates: EntityTable<ExchangeRates, 'base'>;
  documents: EntityTable<StoredDocument, 'id'>;
};

/** Bis zum Rebranding hiess die Datenbank wie die App "subpulse" (siehe migrateLegacyDatabase). */
const DATABASE_NAME = 'hardcost';
const LEGACY_DATABASE_NAME = 'subpulse';

export const db = new Dexie(DATABASE_NAME) as HardCostDatabase;

/** Alle Schema-Versionen – gilt für die aktuelle und die alte Datenbank, damit diese vor dem Umzug aktuell ist. */
function defineSchema(target: HardCostDatabase): void {
  target.version(1).stores({
    subscriptions: 'id, categoryId, billingCycle, name',
    categories: 'id, name',
    settings: 'id',
    exchangeRates: 'base',
  });

  // v2: Zombie-Erkennung. Bestehende Abos hatten kein Erfassungsdatum – sie gelten als heute geprüft,
  // sonst wären nach dem Update alle älteren Verträge auf einen Schlag als "vergessen" markiert.
  target.version(2)
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
  target.version(3).stores({
    documents: 'id, subscriptionId, createdAt',
  });

  // v4: Gekündigt-Status. Früher einfach deaktivierte Abos erhalten das Ende ihres letzten Preises als
  // Vertragsende – die Karte zeigt dann "Gekündigt · beendet am …" statt nur "Inaktiv".
  target.version(4)
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

}

defineSchema(db);

// Wird nur beim allerersten Anlegen der Datenbank ausgeführt.
db.on('populate', async (tx) => {
  await tx.table<Category, string>('categories').bulkAdd(DEFAULT_CATEGORIES);
  await tx.table<SettingsRecord, string>('settings').add({ id: 'user', ...DEFAULT_SETTINGS });
});

/**
 * Einmaliger Umzug nach dem Rebranding: Gibt es noch die alte "subpulse"-Datenbank, aber noch keine
 * neue, werden alle Tabellen übernommen. Danach wird die alte gelöscht. Weil nur umgezogen wird,
 * solange die neue Datenbank noch nicht existiert, kann ein späterer Start nichts überschreiben.
 */
export async function migrateLegacyDatabase(): Promise<void> {
  const [hasCurrent, hasLegacy] = await Promise.all([Dexie.exists(DATABASE_NAME), Dexie.exists(LEGACY_DATABASE_NAME)]);
  if (hasCurrent || !hasLegacy) return;

  const legacy = new Dexie(LEGACY_DATABASE_NAME) as HardCostDatabase;
  defineSchema(legacy);
  const [subscriptions, categories, settings, exchangeRates, documents] = await Promise.all([
    legacy.subscriptions.toArray(),
    legacy.categories.toArray(),
    legacy.settings.toArray(),
    legacy.exchangeRates.toArray(),
    legacy.documents.toArray(),
  ]);
  legacy.close();

  // Die neue Datenbank legt beim Öffnen Standard-Kategorien an – diese durch die alten Daten ersetzen.
  await db.transaction('rw', [db.subscriptions, db.categories, db.settings, db.exchangeRates, db.documents], async () => {
    await Promise.all([db.categories.clear(), db.settings.clear()]);
    await Promise.all([
      db.subscriptions.bulkPut(subscriptions),
      db.categories.bulkPut(categories),
      db.settings.bulkPut(settings),
      db.exchangeRates.bulkPut(exchangeRates),
      db.documents.bulkPut(documents),
    ]);
  });
  // Nicht abwarten: Ist die alte App noch in einem anderen Tab offen, wird erst danach gelöscht.
  void Dexie.delete(LEGACY_DATABASE_NAME).catch(() => undefined);
}
