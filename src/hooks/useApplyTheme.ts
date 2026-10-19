import { useEffect, useRef } from 'react';
import type { ThemePreference } from '../types';

const THEME_COLORS = { light: '#f4f4f5', dark: '#09090b' } as const;
const TRANSITION_MS = 450;

/**
 * Setzt die `dark`-Klasse auf <html>, folgt bei "system" dem Betriebssystem und
 * blendet Farben beim Umschalten weich über (nicht beim ersten Laden).
 */
export function useApplyTheme(theme: ThemePreference): void {
  const appliedOnce = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;

    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      if (appliedOnce.current && !reduceMotion.matches && isDark !== root.classList.contains('dark')) {
        root.classList.add('theme-transition');
        window.clearTimeout(timer);
        timer = window.setTimeout(() => root.classList.remove('theme-transition'), TRANSITION_MS);
      }
      root.classList.toggle('dark', isDark);
      // Statusleiste/Titelleiste der installierten App an das gewählte Theme anpassen.
      document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
        meta.setAttribute('content', isDark ? THEME_COLORS.dark : THEME_COLORS.light);
      });
      appliedOnce.current = true;
    };

    apply();
    media.addEventListener('change', apply);
    return () => {
      media.removeEventListener('change', apply);
      window.clearTimeout(timer);
    };
  }, [theme]);
}
