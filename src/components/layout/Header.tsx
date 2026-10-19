import { Activity, Monitor, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';

interface HeaderProps {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Hell', icon: Sun },
  { value: 'system' as const, label: 'System', icon: Monitor },
  { value: 'dark' as const, label: 'Dunkel', icon: Moon },
];

export function Header({ theme, onThemeChange }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[30%] bg-linear-to-br from-sky-400 to-violet-500 text-white shadow-lg shadow-violet-500/25">
          <Activity className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl leading-tight font-semibold tracking-tight">SubPulse</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Deine Abos im Blick</p>
        </div>
      </div>
      <SegmentedControl
        options={THEME_OPTIONS}
        value={theme}
        onChange={onThemeChange}
        layoutId="theme-toggle"
        ariaLabel="Erscheinungsbild"
        iconOnly
      />
    </header>
  );
}
