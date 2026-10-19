/** Eindeutige ID für lokal erzeugte Datensätze. */
export function createId(): string {
  return crypto.randomUUID();
}
