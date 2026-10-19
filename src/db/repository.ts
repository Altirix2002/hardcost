import type { Category, CategoryColor, Subscription } from '../types';
import { createId } from '../utils/id';
import { db } from './database';
import { DEMO_SUBSCRIPTIONS } from './seed';

/** Legt ein Abo an oder überschreibt es vollständig (inkl. Preisintervallen). */
export async function saveSubscription(subscription: Subscription): Promise<void> {
  await db.subscriptions.put(subscription);
}

export async function deleteSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}

export async function loadDemoSubscriptions(): Promise<void> {
  await db.subscriptions.bulkPut(DEMO_SUBSCRIPTIONS);
}

/** Erstellt eine eigene Kategorie; existiert der Name bereits, wird die bestehende zurückgegeben. */
export async function createCategory(name: string, color: CategoryColor): Promise<Category> {
  const trimmed = name.trim();
  const key = trimmed.toLocaleLowerCase('de-CH');

  return db.transaction('rw', db.categories, async () => {
    const existing = await db.categories.filter((c) => c.name.toLocaleLowerCase('de-CH') === key).first();
    if (existing) return existing;

    const category: Category = { id: createId(), name: trimmed, color, isCustom: true };
    await db.categories.add(category);
    return category;
  });
}
