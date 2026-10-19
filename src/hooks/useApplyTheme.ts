import { useEffect } from 'react';
import type { ThemePreference } from '../types';

/** Setzt die `dark`-Klasse auf <html> und folgt bei "system" dem Betriebssystem. */
export function useApplyTheme(theme: ThemePreference): void {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
