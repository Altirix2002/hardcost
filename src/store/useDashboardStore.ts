import { create } from 'zustand';
import type { SubscriptionSortKey, SubscriptionStatusFilter, SubscriptionViewMode } from '../types';

const VIEW_MODE_KEY = 'hardcost-view-mode';
const SORT_KEY = 'hardcost-sort-key';
const SORT_KEYS: SubscriptionSortKey[] = ['due', 'cost', 'name', 'manual'];

/** Gewählte Ansicht pro Gerät merken (reine Komfort-Einstellung, darf fehlen). */
function readViewMode(): SubscriptionViewMode {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'tiles' ? 'tiles' : 'list';
  } catch {
    return 'list';
  }
}

/** Gewählte Sortierung merken – vor allem die eigene Reihenfolge soll nach dem Neustart bleiben. */
function readSortKey(): SubscriptionSortKey {
  try {
    const stored = localStorage.getItem(SORT_KEY);
    return SORT_KEYS.find((key) => key === stored) ?? 'due';
  } catch {
    return 'due';
  }
}

interface DashboardState {
  sortKey: SubscriptionSortKey;
  statusFilter: SubscriptionStatusFilter;
  searchQuery: string;
  /** Abo-Karte, deren Wisch-Aktionen gerade offen sind (immer höchstens eine). */
  openSwipeId: string | null;
  viewMode: SubscriptionViewMode;
  /** Anordnen-Modus: Karten wackeln und lassen sich verschieben (nur bei eigener Reihenfolge). */
  reordering: boolean;
  setSortKey: (sortKey: SubscriptionSortKey) => void;
  setStatusFilter: (statusFilter: SubscriptionStatusFilter) => void;
  setSearchQuery: (searchQuery: string) => void;
  /** Suche leeren und Status-Filter auf "Alle" zurücksetzen. */
  resetFilters: () => void;
  setOpenSwipeId: (id: string | null) => void;
  setViewMode: (viewMode: SubscriptionViewMode) => void;
  setReordering: (reordering: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sortKey: readSortKey(),
  statusFilter: 'all',
  searchQuery: '',
  openSwipeId: null,
  viewMode: readViewMode(),
  reordering: false,
  setSortKey: (sortKey) => {
    try {
      localStorage.setItem(SORT_KEY, sortKey);
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
    }
    // Andere Sortierung beendet das Anordnen; die eigene Reihenfolge bleibt gespeichert.
    set((state) => ({ sortKey, reordering: sortKey === 'manual' && state.reordering }));
  },
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () => set({ statusFilter: 'all', searchQuery: '' }),
  setOpenSwipeId: (openSwipeId) => set({ openSwipeId }),
  setViewMode: (viewMode) => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
    }
    set({ viewMode, openSwipeId: null });
  },
  setReordering: (reordering) => set({ reordering, openSwipeId: null }),
}));
