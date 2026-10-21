import type { Category, CategoryColor, StoredDocument, Subscription } from '../types';
import { extractBrandColors } from '../utils/brandColors';
import { addDays, toISODate } from '../utils/dates';
import { getDocumentType } from '../utils/documents';
import { createId } from '../utils/id';
import { db } from './database';
import { DEFAULT_CATEGORIES, DEMO_SUBSCRIPTIONS } from './seed';

/** Legt ein Abo an oder überschreibt es vollständig (inkl. Preisintervallen). */
export async function saveSubscription(subscription: Subscription): Promise<void> {
  await db.subscriptions.put(subscription);
}

/** Was beim Löschen entfernt wurde – genug, um es per "Rückgängig" wiederherzustellen. */
export interface DeletedSubscription {
  subscription: Subscription;
  documents: StoredDocument[];
}

/** Löscht ein Abo samt seinen Dokumenten und liefert einen Schnappschuss für "Rückgängig". */
export async function deleteSubscription(id: string): Promise<DeletedSubscription | null> {
  return db.transaction('rw', db.subscriptions, db.documents, async () => {
    const subscription = await db.subscriptions.get(id);
    if (!subscription) return null;
    const documents = await db.documents.where('subscriptionId').equals(id).toArray();
    await db.documents.where('subscriptionId').equals(id).delete();
    await db.subscriptions.delete(id);
    return { subscription, documents };
  });
}

export async function restoreSubscription({ subscription, documents }: DeletedSubscription): Promise<void> {
  await db.transaction('rw', db.subscriptions, db.documents, async () => {
    await db.subscriptions.put(subscription);
    await db.documents.bulkPut(documents);
  });
}

/** Diese Demo bleibt ungeprüft und zeigt so den Zombie-Hinweis. */
const DEMO_ZOMBIE_ID = 'demo-icloud';

/** Diese Demo steckt in einer Gratis-Testphase, die in wenigen Tagen endet. */
const DEMO_TRIAL_ID = 'demo-disney';

export async function loadDemoSubscriptions(): Promise<void> {
  const now = new Date();
  const today = toISODate(now);
  const trialStart = toISODate(addDays(now, -25));
  await db.subscriptions.bulkPut(
    DEMO_SUBSCRIPTIONS.map((sub) => {
      if (sub.id === DEMO_ZOMBIE_ID) return sub;
      if (sub.id === DEMO_TRIAL_ID) {
        return {
          ...sub,
          firstBillingDate: trialStart,
          trialEndsAt: toISODate(addDays(now, 4)),
          intervals: sub.intervals.map((interval) => ({ ...interval, startDate: trialStart })),
          lastReviewedAt: today,
        };
      }
      return { ...sub, lastReviewedAt: today };
    }),
  );
}

/** Erstellt eine eigene Kategorie; existiert der Name bereits, wird die bestehende zurückgegeben. */
export async function createCategory(name: string, color: CategoryColor, monthlyBudget?: number): Promise<Category> {
  const trimmed = name.trim();
  const key = trimmed.toLocaleLowerCase('de-CH');

  return db.transaction('rw', db.categories, async () => {
    const existing = await db.categories.filter((c) => c.name.toLocaleLowerCase('de-CH') === key).first();
    if (existing) return existing;

    const category: Category = { id: createId(), name: trimmed, color, isCustom: true, monthlyBudget };
    await db.categories.add(category);
    return category;
  });
}

/** Auffangkategorie für Abos, deren Kategorie gelöscht wird. */
export const FALLBACK_CATEGORY_ID = 'cat-other';

/** Benennt eine Kategorie um bzw. färbt sie neu; der Name muss eindeutig bleiben. */
export async function updateCategory(
  id: string,
  name: string,
  color: CategoryColor,
  monthlyBudget?: number,
): Promise<void> {
  const trimmed = name.trim();
  const key = trimmed.toLocaleLowerCase('de-CH');

  await db.transaction('rw', db.categories, async () => {
    const duplicate = await db.categories
      .filter((c) => c.id !== id && c.name.toLocaleLowerCase('de-CH') === key)
      .first();
    if (duplicate) throw new Error(`Die Kategorie «${duplicate.name}» gibt es schon.`);
    await db.categories.update(id, { name: trimmed, color, monthlyBudget });
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

// ─── Dokumente ──────────────────────────────────────────────────────────────

/**
 * Speichert eine Datei als Dokument eines Abos (vorher mit validateDocumentFile prüfen).
 * Bittet den Browser beim ersten Dokument, den Speicher dauerhaft zu behalten – sonst darf er
 * IndexedDB bei Platzmangel löschen, und mit ihr die Verträge.
 */
export async function addDocument(subscriptionId: string, file: File): Promise<void> {
  const fileType = getDocumentType(file);
  if (!fileType) throw new Error('Nicht unterstützter Dateityp.');
  await db.documents.add({
    id: createId(),
    subscriptionId,
    fileName: file.name,
    fileType,
    fileSize: file.size,
    // Als eigenständigen Blob kopieren: Ein File-Verweis kann nach dem Neuladen ungültig sein.
    blob: new Blob([await file.arrayBuffer()], { type: fileType }),
    createdAt: new Date().toISOString(),
  });
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // Nicht unterstützt – Dokumente bleiben trotzdem gespeichert.
  }
}

export async function deleteDocument(id: string): Promise<void> {
  await db.documents.delete(id);
}

/**
 * Einmalig für Abos mit Logo, aber ohne Markenfarben (vor Meilenstein 9 gespeichert): Farben nachträglich
 * bestimmen. Ändert nur dieses Feld – zählt also nicht als Prüfung (Zombie-Erkennung).
 */
export async function backfillBrandColors(): Promise<void> {
  const missing = await db.subscriptions.filter((sub) => Boolean(sub.logoUrl) && !sub.brandColors).toArray();
  for (const sub of missing) {
    const brandColors = sub.logoUrl ? await extractBrandColors(sub.logoUrl) : null;
    if (brandColors) await db.subscriptions.update(sub.id, { brandColors });
  }
}

/** Speichert die eigene Reihenfolge: Position = Index in `orderedIds`. */
export async function saveManualOrder(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.subscriptions, async () => {
    await Promise.all(orderedIds.map((id, sortOrder) => db.subscriptions.update(id, { sortOrder })));
  });
}
