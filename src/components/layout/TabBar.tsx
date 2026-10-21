import { motion } from 'framer-motion';
import { ChartPie, Ghost, LayoutGrid, WalletCards } from 'lucide-react';
import { tabPanelId } from '../../store/useNavigationStore';
import type { AppTab } from '../../types';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface TabBarProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  /** Eindeutig pro Instanz (Mobile-Dock und Header rendern je eine). */
  layoutId: string;
  /** Handy: Nur der aktive Tab zeigt seinen Namen, die anderen nur das Symbol (passt so neben den Plus-Knopf). */
  compact?: boolean;
  className?: string;
}

const TABS = [
  { id: 'overview' as const, label: 'Übersicht', icon: LayoutGrid },
  { id: 'subscriptions' as const, label: 'Abos', icon: WalletCards },
  { id: 'statistics' as const, label: 'Statistiken', icon: ChartPie },
  { id: 'archive' as const, label: 'Friedhof', icon: Ghost },
];

/** Schwebende Glas-Pille mit gleitender Markierung des aktiven Tabs. */
export function TabBar({ activeTab, onChange, layoutId, compact = false, className }: TabBarProps) {
  return (
    <motion.nav
      layout={compact}
      transition={spring}
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
        const showLabel = !compact || active;
        return (
          <motion.button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={tabPanelId(id)}
            aria-label={showLabel ? undefined : label}
            onClick={() => onChange(id)}
            // Kompakt ändert sich die Breite beim Wechsel – Layout-Animation statt Sprung.
            layout={compact}
            transition={spring}
            className={cn(
              'relative flex h-11 items-center gap-2 rounded-full text-sm font-medium transition-colors',
              showLabel ? 'px-4' : 'w-11 justify-center',
              'focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none',
              active ? 'text-white' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className="bg-brand-gradient absolute inset-0 rounded-full shadow-md shadow-violet-500/30"
              />
            )}
            <motion.span layout={compact ? 'position' : false} className="relative">
              <Icon className="h-4 w-4" aria-hidden />
            </motion.span>
            {showLabel && (
              <motion.span
                layout={compact ? 'position' : false}
                initial={compact ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.08 }}
                className="relative whitespace-nowrap"
              >
                {label}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
