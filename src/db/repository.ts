import type { Category, CategoryColor, Subscription } from '../types';
import { toISODate } from '../utils/dates';
import { createId } from '../utils/id';
import { db } from './database';
import { DEFAULT_CATEGORIES, DEMO_SUBSCRIPTIONS } from './seed';

/** Legt ein Abo an oder überschreibt es vollständig (inkl. Preisintervallen). */
export async function saveSubscription(subscription: Subscription): Promise<void> {
  await db.subscriptions.put(subscription);
}

export async function deleteSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}

/** Diese Demo bleibt ungeprüft und zeigt so den Zombie-Hinweis. */
const DEMO_ZOMBIE_ID = 'demo-icloud';

export async function loadDemoSubscriptions(): Promise<void> {
  const today = toISODate(new Date());
  await db.subscriptions.bulkPut(
    DEMO_SUBSCRIPTIONS.map((sub) => (sub.id === DEMO_ZOMBIE_ID ? sub : { ...sub, lastReviewedAt: today })),
  );
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

/** Auffangkategorie für Abos, deren Kategorie gelöscht wird. */
export const FALLBACK_CATEGORY_ID = 'cat-other';

/** Benennt eine Kategorie um bzw. färbt sie neu; der Name muss eindeutig bleiben. */
export async function updateCategory(id: string, name: string, color: CategoryColor): Promise<void> {
  const trimmed = name.trim();
  const key = trimmed.toLocaleLowerCase('de-CH');

  await db.transaction('rw', db.categories, async () => {
    const duplicate = await db.categories
      .filter((c) => c.id !== id && c.name.toLocaleLowerCase('de-CH') === key)
      .first();
    if (duplicate) throw new Error(`Die Kategorie «${duplicate.name}» gibt es schon.`);
    await db.categories.update(id, { name: trimmed, color });
  });
}

/** Löscht eine Kategorie; ihre Abos wandern nach «Sonstiges» (wird bei Bedarf neu angelegt). */
export async function deleteCategory(id: string): Promise<void> {
  if (id === FALLBACK_CATEGORY_ID) throw new Error('«Sonstiges» bleibt als Auffangkategorie bestehen.');

  await db.transaction('rw', db.categories, db.subscriptions, async () => {
    const fallback = DEFAULT_CATEGORIES.find((c) => c.id === FALLBACK_CATEGORY_ID);
    if (fallback && !(await db.categories.get(FALLBACK_CATEGORY_ID))) await db.categories.add(fallback);
    await db.subscriptions.where('categoryId').equals(id).modify({ categoryId: FALLBACK_CATEGORY_ID });
    await db.categories.delete(id);
  });
}
