import type { DocumentMimeType } from '../types';

/** Obergrenze pro Dokument, damit der Browser-Speicher nicht überläuft. */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

const EXTENSION_TYPES: Record<string, DocumentMimeType> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/** Ermittelt den Dateityp; manche Handys liefern kein `file.type`, dann zählt die Endung. */
export function getDocumentType(file: File): DocumentMimeType | null {
  if (file.type === 'application/pdf' || file.type === 'image/png' || file.type === 'image/jpeg') return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[extension] ?? null;
}

/** Fehlermeldung für ungeeignete Dateien, sonst null. */
export function validateDocumentFile(file: File): string | null {
  if (!getDocumentType(file)) return `«${file.name}» ist kein PDF, JPG oder PNG.`;
  if (file.size > MAX_DOCUMENT_BYTES) return `«${file.name}» ist grösser als 5 MB.`;
  return null;
}

export function isImageDocument(type: DocumentMimeType): boolean {
  return type !== 'application/pdf';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
