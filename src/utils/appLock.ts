import type { AppLockConfig } from '../types';

const STORAGE_KEY = 'subpulse-app-lock';

export const PIN_LENGTH = 4;

/** Im Hintergrund bis zu so lange ohne erneute Sperre – z.B. für Dateiauswahl oder kurzen App-Wechsel. */
export const LOCK_GRACE_MS = 30_000;

/** Nach so vielen Fehlversuchen wird die PIN-Eingabe kurz gesperrt. */
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 30_000;

function isLockConfig(value: unknown): value is AppLockConfig {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.enabled === 'boolean' &&
    typeof record.pinHash === 'string' &&
    typeof record.pinSalt === 'string' &&
    (record.credentialId === undefined || typeof record.credentialId === 'string')
  );
}

export function loadLockConfig(): AppLockConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isLockConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLockConfig(config: AppLockConfig | null): void {
  try {
    if (config) localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Speicher blockiert (z.B. privater Modus) – Sperre gilt dann nur bis zum Neuladen.
  }
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

/** Neue Konfiguration mit gesalzenem PIN-Hash; der PIN selbst wird nie gespeichert. */
export async function createLockConfig(pin: string, credentialId?: string): Promise<AppLockConfig> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const pinSalt = toHex(salt);
  return { enabled: true, pinSalt, pinHash: await hashPin(pin, pinSalt), credentialId };
}

export async function verifyPin(config: AppLockConfig, pin: string): Promise<boolean> {
  return (await hashPin(pin, config.pinSalt)) === config.pinHash;
}
