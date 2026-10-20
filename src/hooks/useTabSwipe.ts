import { useEffect } from 'react';
import { TAB_ORDER, useNavigationStore } from '../store/useNavigationStore';

/** Ab dieser waagrechten Strecke wechselt der Tab – noch während der Finger auf dem Display ist. */
const TRIGGER_DISTANCE = 60;
/** Bewegt sich der Finger zuerst so weit senkrecht, ist es Scrollen und keine Tab-Geste. */
const VERTICAL_CANCEL = 24;

/**
 * Horizontales Wischen wechselt zwischen den Tabs (nur Touch).
 * Ausgewertet wird schon bei `touchmove`: Übernimmt der Browser die Bewegung (z.B. zum Scrollen),
 * schickt Chrome statt `touchend` oft nur `touchcancel` – darauf zu warten klappte am Handy nicht.
 * Bereiche mit eigener Geste (Abo-Karten, Chart) und offene Fenster bleiben aussen vor.
 */
export function useTabSwipe() {
  useEffect(() => {
    let start: { x: number; y: number } | null = null;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target instanceof Element ? event.target : null;
      const excluded = target?.closest('[data-no-tab-swipe], [role=dialog], input, textarea, select');
      start = touch && event.touches.length === 1 && !excluded ? { x: touch.clientX, y: touch.clientY } : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dy) > VERTICAL_CANCEL && Math.abs(dy) > Math.abs(dx)) {
        start = null;
        return;
      }
      if (Math.abs(dx) < TRIGGER_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      start = null; // nur ein Wechsel pro Geste
      const { activeTab, setActiveTab } = useNavigationStore.getState();
      const next = TAB_ORDER[TAB_ORDER.indexOf(activeTab) + (dx < 0 ? 1 : -1)];
      if (next) setActiveTab(next);
    };

    const reset = () => {
      start = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', reset, { passive: true });
    document.addEventListener('touchcancel', reset, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', reset);
      document.removeEventListener('touchcancel', reset);
    };
  }, []);
}
