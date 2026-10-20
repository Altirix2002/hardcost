import { create } from 'zustand';
import { db } from '../db/database';
import { DEFAULT_SETTINGS } from '../db/seed';
import { fetchLatestRates, isRatesFresh } from '../services/currency';
import type { ExchangeRates, SettingsRecord, ThemePreference, UserSettings } from '../types';
import { getCustomPaymentMethods, isDefaultPaymentMethod, normalizePaymentMethod } from '../utils/options';

interface SettingsState {
  settings: UserSettings;
  rates: ExchangeRates | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Übernimmt Änderungen und speichert sie in IndexedDB. */
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setBaseCurrency: (currency: string) => Promise<void>;
  /** Merkt sich eine selbst eingetippte Zahlungsart dauerhaft als Vorschlag. */
  rememberPaymentMethod: (method: string) => Promise<void>;
  forgetPaymentMethod: (method: string) => Promise<void>;
  /** Lädt Kurse neu, sofern der Cache veraltet ist (oder `force`). */
  refreshRates: (options?: { force?: boolean }) => Promise<void>;
}

function toSettings(record: SettingsRecord): UserSettings {
  const { baseCurrency, theme, paymentMethods, monthlyBudget, lastBackupAt } = record;
  return { baseCurrency, theme, paymentMethods, monthlyBudget, lastBackupAt };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  rates: null,
  hydrated: false,

  hydrate: async () => {
    const stored = await db.settings.get('user');
    let settings: UserSettings = stored ? toSettings(stored) : DEFAULT_SETTINGS;
    // Einmalige Übernahme: Bisher wurden eigene Zahlungsarten nur aus den Abos abgeleitet.
    if (!settings.paymentMethods) {
      settings = { ...settings, paymentMethods: getCustomPaymentMethods(await db.subscriptions.toArray()) };
      await db.settings.put({ id: 'user', ...settings });
    }
    const cachedRates = (await db.exchangeRates.get(settings.baseCurrency)) ?? null;
    set({ settings, rates: cachedRates, hydrated: true });
    void get().refreshRates();
  },

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await db.settings.put({ id: 'user', ...settings });
  },

  setTheme: (theme) => get().updateSettings({ theme }),

  setBaseCurrency: async (baseCurrency) => {
    const cachedRates = (await db.exchangeRates.get(baseCurrency)) ?? null;
    set({ rates: cachedRates });
    await get().updateSettings({ baseCurrency });
    await get().refreshRates();
  },

  rememberPaymentMethod: async (method) => {
    const label = method.trim();
    const known = get().settings.paymentMethods ?? [];
    const key = normalizePaymentMethod(label);
    if (!label || isDefaultPaymentMethod(label) || known.some((m) => normalizePaymentMethod(m) === key)) return;
    await get().updateSettings({ paymentMethods: [...known, label] });
  },

  forgetPaymentMethod: async (method) => {
    const key = normalizePaymentMethod(method);
    const known = get().settings.paymentMethods ?? [];
    await get().updateSettings({ paymentMethods: known.filter((m) => normalizePaymentMethod(m) !== key) });
  },

  refreshRates: async (options) => {
    const { settings, rates: cached } = get();
    if (!options?.force && cached?.base === settings.baseCurrency && isRatesFresh(cached)) return;

    const { baseCurrency } = settings;
    try {
      const rates = await fetchLatestRates(baseCurrency);
      await db.exchangeRates.put(rates);
      set({ rates });
    } catch {
      // Offline oder API nicht erreichbar: gecachte Kurse bleiben aktiv.
    }
  },
}));
