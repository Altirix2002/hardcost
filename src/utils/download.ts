/** Bietet Text (z.B. ein JSON-Backup) als Datei zum Speichern an. */
export function downloadTextFile(fileName: string, content: string, mimeType = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Erst nach dem Klick freigeben, sonst bricht der Download in manchen Browsern ab.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
