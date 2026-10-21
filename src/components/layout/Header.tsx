import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, Moon, Settings, Sun, WifiOff } from 'lucide-react';
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

/** App-Logo aus den PWA-Icons (liegt im Precache und funktioniert damit auch offline). */
const APP_ICON_URL = `${import.meta.env.BASE_URL}pwa-192x192.png`;

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
        <img
          src={APP_ICON_URL}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-[22%] shadow-lg shadow-violet-500/30"
        />
        <div className="min-w-0">
          <h1 className="text-brand-gradient w-fit text-xl leading-tight font-semibold tracking-tight">HardCost</h1>
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
