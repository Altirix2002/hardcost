import { motion } from 'framer-motion';
import { ChartPie, LayoutGrid } from 'lucide-react';
import { tabPanelId } from '../../store/useNavigationStore';
import type { AppTab } from '../../types';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface TabBarProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  /** Eindeutig pro Instanz (Mobile-Dock und Header rendern je eine). */
  layoutId: string;
  className?: string;
}

const TABS = [
  { id: 'overview' as const, label: 'Übersicht', icon: LayoutGrid },
  { id: 'statistics' as const, label: 'Statistiken', icon: ChartPie },
];

/** Schwebende Glas-Pille mit gleitender Markierung des aktiven Tabs. */
export function TabBar({ activeTab, onChange, layoutId, className }: TabBarProps) {
  return (
    <nav
      role="tablist"
      aria-label="Hauptnavigation"
      className={cn(
        'inline-flex rounded-full border border-white/40 bg-white/60 p-1 shadow-lg shadow-zinc-900/10 backdrop-blur-xl',
        'dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-black/40',
        className,
      )}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = id === activeTab;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={tabPanelId(id)}
            onClick={() => onChange(id)}
            className={cn(
              'relative flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none',
              active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-zinc-700/80"
              />
            )}
            <Icon className="relative h-4 w-4" aria-hidden />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
