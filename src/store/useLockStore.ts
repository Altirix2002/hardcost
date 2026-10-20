import { create } from 'zustand';
import type { AppLockConfig } from '../types';
import { loadLockConfig, saveLockConfig } from '../utils/appLock';

interface LockState {
  config: AppLockConfig | null;
  /** Gesperrt: Die App ist ausgehängt, nur der Sperrbildschirm ist im DOM. */
  locked: boolean;
  /** Kurzer Sichtschutz, solange die App im Hintergrund ist (App-Umschalter-Vorschau). */
  covered: boolean;
  setConfig: (config: AppLockConfig | null) => void;
  lock: () => void;
  unlock: () => void;
  setCovered: (covered: boolean) => void;
}

const initialConfig = loadLockConfig();

export const useLockStore = create<LockState>((set) => ({
  config: initialConfig,
  // Kaltstart: Mit aktiver Sperre startet die App gesperrt.
  locked: initialConfig?.enabled ?? false,
  covered: false,
  setConfig: (config) => {
    saveLockConfig(config);
    set({ config });
  },
  lock: () => set((state) => ({ locked: state.config?.enabled ?? false })),
  unlock: () => set({ locked: false }),
  setCovered: (covered) => set({ covered }),
}));
