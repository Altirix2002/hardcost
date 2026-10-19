import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Monitor, Moon, Settings, Sun, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import type { AppTab, ThemePreference } from '../../types';
import { IconButton } from '../ui/IconButton';
import { SegmentedControl } from '../ui/SegmentedControl';
import { TabBar } from './TabBar';

interface HeaderProps {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenSettings: () => void;
}

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Hell', icon: Sun },
  { value: 'system' as const, label: 'System', icon: Monitor },
  { value: 'dark' as const, label: 'Dunkel', icon: Moon },
];

export function Header({ theme, onThemeChange, activeTab, onTabChange, onOpenSettings }: HeaderProps) {
  const online = useOnlineStatus();

  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[30%] bg-linear-to-br from-sky-400 to-violet-500 text-white shadow-lg shadow-violet-500/25">
          <Activity className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl leading-tight font-semibold tracking-tight">SubPulse</h1>
          <AnimatePresence mode="wait" initial={false}>
            {online ? (
              <motion.p key="online" exit={{ opacity: 0 }} className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Deine Abos im Blick
              </motion.p>
            ) : (
              <motion.p
                key="offline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400"
              >
                <WifiOff className="h-3 w-3" aria-hidden />
                Offline – lokale Daten
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Wrapper statt className: TabBar setzt selbst inline-flex, das würde mit "hidden" kollidieren. */}
      <div className="hidden sm:block">
        <TabBar activeTab={activeTab} onChange={onTabChange} layoutId="tab-desktop" />
      </div>

      <div className="flex items-center justify-self-end gap-1">
        <div className="hidden md:block">
          <SegmentedControl
            options={THEME_OPTIONS}
            value={theme}
            onChange={onThemeChange}
            layoutId="theme-toggle"
            ariaLabel="Erscheinungsbild"
            iconOnly
          />
        </div>
        <IconButton icon={Settings} label="Einstellungen" onClick={onOpenSettings} />
      </div>
    </header>
  );
}
