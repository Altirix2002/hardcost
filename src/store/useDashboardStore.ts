import { create } from 'zustand';
import type { SubscriptionSortKey, SubscriptionStatusFilter, SubscriptionViewMode } from '../types';

const VIEW_MODE_KEY = 'hardcost-view-mode';

/** Gewählte Ansicht pro Gerät merken (reine Komfort-Einstellung, darf fehlen). */
function readViewMode(): SubscriptionViewMode {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'tiles' ? 'tiles' : 'list';
  } catch {
    return 'list';
  }
}

interface DashboardState {
  sortKey: SubscriptionSortKey;
  statusFilter: SubscriptionStatusFilter;
  searchQuery: string;
  /** Abo-Karte, deren Wisch-Aktionen gerade offen sind (immer höchstens eine). */
  openSwipeId: string | null;
  viewMode: SubscriptionViewMode;
  setSortKey: (sortKey: SubscriptionSortKey) => void;
  setStatusFilter: (statusFilter: SubscriptionStatusFilter) => void;
  setSearchQuery: (searchQuery: string) => void;
  /** Suche leeren und Status-Filter auf "Alle" zurücksetzen. */
  resetFilters: () => void;
  setOpenSwipeId: (id: string | null) => void;
  setViewMode: (viewMode: SubscriptionViewMode) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sortKey: 'due',
  statusFilter: 'all',
  searchQuery: '',
  openSwipeId: null,
  viewMode: readViewMode(),
  setSortKey: (sortKey) => set({ sortKey }),
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
}));
