import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { db } from '../db/database';
import { DEFAULT_SETTINGS } from '../db/seed';
import type { BackupDocument, BackupFile, ParsedBackup, StoredDocument } from '../types';
import { parseBackup } from '../utils/backupValidation';
import { toISODate } from '../utils/dates';

/** Name der JSON-Datei innerhalb eines ZIP-Backups; ältere Sicherungen stammen noch aus SubPulse. */
const ZIP_JSON_NAME = 'hardcost-backup.json';
const LEGACY_ZIP_JSON_NAME = 'subpulse-backup.json';

/** Liest alle lokalen Daten (ohne Kurs-Cache und Dokumente) in ein Backup-Objekt. */
export async function createBackup(): Promise<BackupFile> {
  const [subscriptions, categories, stored] = await Promise.all([
    db.subscriptions.toArray(),
    db.categories.toArray(),
    db.settings.get('user'),
  ]);

  return {
    app: 'hardcost',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: stored
      ? {
          baseCurrency: stored.baseCurrency,
          theme: stored.theme,
          paymentMethods: stored.paymentMethods,
          monthlyBudget: stored.monthlyBudget,
          paymentCards: stored.paymentCards,
          netIncome: stored.netIncome,
          costRatioThresholds: stored.costRatioThresholds,
        }
      : DEFAULT_SETTINGS,
    categories,
    subscriptions,
  };
}

export function backupFileName(date: Date = new Date(), extension: 'json' | 'zip' = 'json'): string {
  return `hardcost-backup-${toISODate(date)}.${extension}`;
}

/** Dateiname im Archiv: eindeutig per ID, ohne Zeichen, die Dateisysteme stören. */
function archivePath(doc: StoredDocument): string {
  const safeName = doc.fileName.replace(/[^\w.\-äöüÄÖÜ ]+/g, '_').slice(0, 80);
  return `documents/${doc.id}-${safeName}`;
}

/**
 * ZIP mit dem JSON-Backup plus allen Dokumenten unter documents/.
 * PDFs und Bilder sind schon komprimiert – sie werden nur abgelegt (schneller, kaum grösser).
 */
export async function createBackupZip(): Promise<{ blob: Blob; backup: BackupFile; documentCount: number }> {
  const [backup, documents] = await Promise.all([createBackup(), db.documents.toArray()]);
  const files: Zippable = {};
  const meta: BackupDocument[] = [];

  for (const doc of documents) {
    const path = archivePath(doc);
    files[path] = [new Uint8Array(await doc.blob.arrayBuffer()), { level: 0 }];
    meta.push({
      id: doc.id,
      subscriptionId: doc.subscriptionId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      createdAt: doc.createdAt,
      path,
    });
  }

  const withDocuments: BackupFile = { ...backup, documents: meta };
  files[ZIP_JSON_NAME] = strToU8(JSON.stringify(withDocuments, null, 2));
  const zipped = zipSync(files);
  return {
    blob: new Blob([new Uint8Array(zipped)], { type: 'application/zip' }),
    backup: withDocuments,
    documentCount: meta.length,
  };
}

function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
}

/** Liest eine JSON- oder ZIP-Sicherung ein und prüft sie vollständig. */
export async function readBackupFile(file: File): Promise<ParsedBackup> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isZip(bytes)) return { backup: parseBackup(strFromU8(bytes)), documents: null };

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new Error('Das ZIP-Archiv ist beschädigt.');
  }
  const json = entries[ZIP_JSON_NAME] ?? entries[LEGACY_ZIP_JSON_NAME];
  if (!json) throw new Error(`Im ZIP fehlt die Datei ${ZIP_JSON_NAME}.`);

  const backup = parseBackup(strFromU8(json));
  const documents = (backup.documents ?? []).map((meta): StoredDocument => {
    const data = entries[meta.path];
    if (!data) throw new Error(`Im ZIP fehlt das Dokument «${meta.fileName}».`);
    return {
      id: meta.id,
      subscriptionId: meta.subscriptionId,
      fileName: meta.fileName,
      fileType: meta.fileType,
      fileSize: meta.fileSize,
      createdAt: meta.createdAt,
      blob: new Blob([new Uint8Array(data)], { type: meta.fileType }),
    };
  });
  return { backup, documents };
}

/**
 * Ersetzt alle Abos, Kategorien und Einstellungen atomar durch den Inhalt des Backups.
 * Mit `documents` (ZIP-Backup) werden auch alle Dokumente ersetzt; ohne bleiben die der
 * weiterhin vorhandenen Abos erhalten.
 */
export async function restoreBackup({ backup, documents }: ParsedBackup): Promise<void> {
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

    if (documents) {
      await db.documents.clear();
      await db.documents.bulkPut(documents);
    } else {
      const ids = backup.subscriptions.map((sub) => sub.id);
      await db.documents.where('subscriptionId').noneOf(ids).delete();
    }
  });
}
