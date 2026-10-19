import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { AppTab } from '../../types';
import { spring } from '../../utils/motion';
import { TabBar } from './TabBar';

interface MobileDockProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onAdd: () => void;
}

/** Unten fixiertes Dock fürs Handy: Tab-Leiste plus runder Hinzufügen-Button. */
export function MobileDock({ activeTab, onTabChange, onAdd }: MobileDockProps) {
  return (
    <motion.div
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 96, opacity: 0 }}
      transition={spring}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
    >
      <TabBar activeTab={activeTab} onChange={onTabChange} layoutId="tab-mobile" className="pointer-events-auto" />
      <motion.button
        type="button"
        aria-label="Abo hinzufügen"
        onClick={onAdd}
        whileTap={{ scale: 0.9 }}
        transition={spring}
        className="pointer-events-auto flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/30 ring-1 ring-white/20 focus-visible:ring-4 focus-visible:ring-sky-500/50 focus-visible:outline-none dark:bg-white dark:text-zinc-900 dark:shadow-black/50"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
      </motion.button>
    </motion.div>
  );
}
