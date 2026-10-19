import Dexie, { type EntityTable } from 'dexie';
import type { Category, ExchangeRates, SettingsRecord, Subscription } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './seed';

type SubPulseDatabase = Dexie & {
  subscriptions: EntityTable<Subscription, 'id'>;
  categories: EntityTable<Category, 'id'>;
  settings: EntityTable<SettingsRecord, 'id'>;
  exchangeRates: EntityTable<ExchangeRates, 'base'>;
};

export const db = new Dexie('subpulse') as SubPulseDatabase;

db.version(1).stores({
  subscriptions: 'id, categoryId, billingCycle, name',
  categories: 'id, name',
  settings: 'id',
  exchangeRates: 'base',
});

// Wird nur beim allerersten Anlegen der Datenbank ausgeführt.
db.on('populate', async (tx) => {
  await tx.table<Category, string>('categories').bulkAdd(DEFAULT_CATEGORIES);
  await tx.table<SettingsRecord, string>('settings').add({ id: 'user', ...DEFAULT_SETTINGS });
});
