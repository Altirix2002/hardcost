import { db } from '../db/database';
import { DEFAULT_SETTINGS } from '../db/seed';
import type { BackupFile } from '../types';
import { toISODate } from '../utils/dates';

/** Liest alle lokalen Daten (ohne Kurs-Cache) in ein Backup-Objekt. */
export async function createBackup(): Promise<BackupFile> {
  const [subscriptions, categories, stored] = await Promise.all([
    db.subscriptions.toArray(),
    db.categories.toArray(),
    db.settings.get('user'),
  ]);

  return {
    app: 'subpulse',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: stored
      ? {
          baseCurrency: stored.baseCurrency,
          theme: stored.theme,
          paymentMethods: stored.paymentMethods,
          monthlyBudget: stored.monthlyBudget,
        }
      : DEFAULT_SETTINGS,
    categories,
    subscriptions,
  };
}

export function backupFileName(date: Date = new Date()): string {
  return `subpulse-backup-${toISODate(date)}.json`;
}

/** Ersetzt alle Abos, Kategorien und Einstellungen atomar durch den Inhalt des Backups. */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  await db.transaction('rw', db.subscriptions, db.categories, db.settings, db.documents, async () => {
    await Promise.all([db.subscriptions.clear(), db.categories.clear()]);
    await db.categories.bulkPut(backup.categories);
    // Ältere Backups kennen kein Prüfdatum: Stand des Exports gilt als geprüft (Zombie-Erkennung).
    const parsedExport = new Date(backup.exportedAt);
    const exported = Number.isNaN(parsedExport.getTime()) ? new Date() : parsedExport;
    const exportedOn = toISODate(exported);
    await db.subscriptions.bulkPut(
      backup.subscriptions.map((sub) => ({ ...sub, lastReviewedAt: sub.lastReviewedAt ?? exportedOn })),
    );
    // Ein eingespieltes Backup gilt als Sicherung vom Exportdatum (Backup-Erinnerung).
    await db.settings.put({ id: 'user', ...backup.settings, lastBackupAt: exported.toISOString() });
    // Dokumente sind nicht Teil des Backups: Nur die von Abos behalten, die es danach noch gibt.
    const ids = backup.subscriptions.map((sub) => sub.id);
    await db.documents.where('subscriptionId').noneOf(ids).delete();
  });
}
