import { create } from 'zustand';
import { db } from '../db/database';
import { DEFAULT_SETTINGS } from '../db/seed';
import { fetchLatestRates } from '../services/currency';
import type { ExchangeRates, ThemePreference, UserSettings } from '../types';

interface SettingsState {
  settings: UserSettings;
  rates: ExchangeRates | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setBaseCurrency: (currency: string) => Promise<void>;
  refreshRates: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  rates: null,
  hydrated: false,

  hydrate: async () => {
    const stored = await db.settings.get('user');
    const settings: UserSettings = stored
      ? { baseCurrency: stored.baseCurrency, theme: stored.theme }
      : DEFAULT_SETTINGS;
    const cachedRates = (await db.exchangeRates.get(settings.baseCurrency)) ?? null;
    set({ settings, rates: cachedRates, hydrated: true });
    void get().refreshRates();
  },

  setTheme: async (theme) => {
    const settings = { ...get().settings, theme };
    set({ settings });
    await db.settings.put({ id: 'user', ...settings });
  },

  setBaseCurrency: async (baseCurrency) => {
    const settings = { ...get().settings, baseCurrency };
    const cachedRates = (await db.exchangeRates.get(baseCurrency)) ?? null;
    set({ settings, rates: cachedRates });
    await db.settings.put({ id: 'user', ...settings });
    await get().refreshRates();
  },

  refreshRates: async () => {
    const { baseCurrency } = get().settings;
    try {
      const rates = await fetchLatestRates(baseCurrency);
      await db.exchangeRates.put(rates);
      set({ rates });
    } catch {
      // Offline oder API nicht erreichbar: gecachte Kurse bleiben aktiv.
    }
  },
}));
