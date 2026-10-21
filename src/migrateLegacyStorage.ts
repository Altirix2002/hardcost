/**
 * Rebranding SubPulse → HardCost: localStorage-Schlüssel übernehmen (App-Sperre, Ansicht,
 * Backup-Erinnerung). Läuft als erster Import in main.tsx – vor den Stores, die beim Laden lesen.
 */
const LEGACY_PREFIX = 'subpulse-';
const PREFIX = 'hardcost-';
const KEYS = ['app-lock', 'view-mode', 'backup-snooze'];

try {
  for (const key of KEYS) {
    const legacy = localStorage.getItem(LEGACY_PREFIX + key);
    if (legacy === null) continue;
    if (localStorage.getItem(PREFIX + key) === null) localStorage.setItem(PREFIX + key, legacy);
    localStorage.removeItem(LEGACY_PREFIX + key);
  }
} catch {
  // Speicher blockiert (z.B. privater Modus) – dann gibt es auch nichts zu übernehmen.
}

export {};
