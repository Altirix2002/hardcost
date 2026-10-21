import { create } from 'zustand';
import type { AppTab } from '../types';

export const TAB_ORDER: AppTab[] = ['overview', 'statistics', 'archive'];

export function isAppTab(value: string | null): value is AppTab {
  return TAB_ORDER.some((tab) => tab === value);
}

/** Verknüpft Tab-Button (aria-controls) und Tab-Inhalt. */
export function tabPanelId(tab: AppTab): string {
  return `tab-panel-${tab}`;
}

interface NavigationState {
  activeTab: AppTab;
  /** +1 = nach rechts gewechselt, -1 = nach links (steuert die Übergangsrichtung). */
  direction: 1 | -1;
  setActiveTab: (tab: AppTab) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  activeTab: 'overview',
  direction: 1,
  setActiveTab: (tab) => {
    const current = get().activeTab;
    if (tab === current) return;
    set({ activeTab: tab, direction: TAB_ORDER.indexOf(tab) > TAB_ORDER.indexOf(current) ? 1 : -1 });
  },
}));
