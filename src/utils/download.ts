/** Bietet Text (z.B. ein JSON-Backup) als Datei zum Speichern an. */
export function downloadTextFile(fileName: string, content: string, mimeType = 'application/json'): void {
  downloadBlob(fileName, new Blob([content], { type: mimeType }));
}

/** Bietet beliebige Daten (z.B. ein ZIP-Backup) als Datei zum Speichern an. */
export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Erst nach dem Klick freigeben, sonst bricht der Download in manchen Browsern ab.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
