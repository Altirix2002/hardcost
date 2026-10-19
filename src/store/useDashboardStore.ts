import { create } from 'zustand';
import type { SubscriptionSortKey, SubscriptionStatusFilter } from '../types';

interface DashboardState {
  sortKey: SubscriptionSortKey;
  statusFilter: SubscriptionStatusFilter;
  setSortKey: (sortKey: SubscriptionSortKey) => void;
  setStatusFilter: (statusFilter: SubscriptionStatusFilter) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sortKey: 'due',
  statusFilter: 'all',
  setSortKey: (sortKey) => set({ sortKey }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));
