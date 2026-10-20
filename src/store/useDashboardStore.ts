import { create } from 'zustand';
import type { SubscriptionSortKey, SubscriptionStatusFilter } from '../types';

interface DashboardState {
  sortKey: SubscriptionSortKey;
  statusFilter: SubscriptionStatusFilter;
  searchQuery: string;
  /** Abo-Karte, deren Wisch-Aktionen gerade offen sind (immer höchstens eine). */
  openSwipeId: string | null;
  setSortKey: (sortKey: SubscriptionSortKey) => void;
  setStatusFilter: (statusFilter: SubscriptionStatusFilter) => void;
  setSearchQuery: (searchQuery: string) => void;
  /** Suche leeren und Status-Filter auf "Alle" zurücksetzen. */
  resetFilters: () => void;
  setOpenSwipeId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sortKey: 'due',
  statusFilter: 'all',
  searchQuery: '',
  openSwipeId: null,
  setSortKey: (sortKey) => set({ sortKey }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () => set({ statusFilter: 'all', searchQuery: '' }),
  setOpenSwipeId: (openSwipeId) => set({ openSwipeId }),
}));
