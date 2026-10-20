import { useRef, type TouchEvent } from 'react';
import { TAB_ORDER, useNavigationStore } from '../store/useNavigationStore';

/** Mindeststrecke und maximale Dauer eines Wischers, der den Tab wechselt. */
const MIN_DISTANCE = 70;
const MAX_DURATION_MS = 700;

/**
 * Horizontales Wischen über dem Inhalt wechselt zwischen den Tabs (nur Touch).
 * Bereiche mit eigener Geste (Abo-Karten, Chart) tragen `data-no-tab-swipe` und bleiben aussen vor.
 */
export function useTabSwipe() {
  const start = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    const target = event.target as Element;
    if (!touch || event.touches.length > 1 || target.closest('[data-no-tab-swipe], input, textarea, select')) {
      start.current = null;
      return;
    }
    start.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const onTouchEnd = (event: TouchEvent) => {
    const origin = start.current;
    start.current = null;
    const touch = event.changedTouches[0];
    if (!origin || !touch) return;

    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (Date.now() - origin.time > MAX_DURATION_MS) return;

    const { activeTab, setActiveTab } = useNavigationStore.getState();
    const index = TAB_ORDER.indexOf(activeTab) + (dx < 0 ? 1 : -1);
    const next = TAB_ORDER[index];
    if (next) setActiveTab(next);
  };

  return { onTouchStart, onTouchEnd };
}
