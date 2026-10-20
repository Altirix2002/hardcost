import { create } from 'zustand';
import type { Toast, ToastAction, ToastKind } from '../types';
import { triggerHaptic } from '../utils/haptics';

/** Anzeigedauer; mit Aktion (z.B. "Rückgängig") etwas länger, damit man sie erwischt. */
const DURATION_MS = 2500;
const DURATION_WITH_ACTION_MS = 4500;

interface ToastState {
  toast: Toast | null;
  show: (kind: ToastKind, message: string, action?: ToastAction) => void;
  dismiss: () => void;
}

let nextId = 1;
let timer: number | undefined;

/** Immer nur eine Meldung – eine neue ersetzt die alte (wie die Dynamic Island). */
export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (kind, message, action) => {
    window.clearTimeout(timer);
    const toast: Toast = { id: nextId++, kind, message, action };
    set({ toast });
    triggerHaptic(kind === 'deleted' ? [10, 40, 10] : 8);
    timer = window.setTimeout(
      () => set((state) => (state.toast?.id === toast.id ? { toast: null } : state)),
      action ? DURATION_WITH_ACTION_MS : DURATION_MS,
    );
  },
  dismiss: () => {
    window.clearTimeout(timer);
    set({ toast: null });
  },
}));

/** Kurzform für Aufrufe ausserhalb von Komponenten. */
export const showToast = (kind: ToastKind, message: string, action?: ToastAction) =>
  useToastStore.getState().show(kind, message, action);
