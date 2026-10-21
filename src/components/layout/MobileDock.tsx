import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { AppTab } from '../../types';
import { cn } from '../../utils/cn';
import { measureMorphOrigin } from '../../utils/morph';
import { spring } from '../../utils/motion';
import { TabBar } from './TabBar';

interface MobileDockProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  /** Bekommt die Lage des Plus-Knopfs – dort beginnt der Morph ins Formular. */
  onAdd: (origin: DOMRect) => void;
  /** Plus-Knopf unsichtbar, solange das Formular aus ihm herausgewachsen ist. */
  addHidden?: boolean;
}

/**
 * Unten fixiertes Dock fürs Handy: Tab-Leiste plus runder Hinzufügen-Button.
 * Bewusst nur verschoben, nicht ausgeblendet – Deckkraft unter 100 % würde den Glas-Blur
 * der Tab-Leiste abschalten, bis die Animation ganz ausgeschwungen ist.
 */
export function MobileDock({ activeTab, onTabChange, onAdd, addHidden = false }: MobileDockProps) {
  return (
    <motion.div
      initial={{ y: 128 }}
      animate={{ y: 0 }}
      exit={{ y: 128 }}
      transition={spring}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
    >
      <TabBar
        activeTab={activeTab}
        onChange={onTabChange}
        layoutId="tab-mobile"
        compact
        className="pointer-events-auto"
      />
      <motion.button
        type="button"
        aria-label="Abo hinzufügen"
        onClick={(event) => onAdd(measureMorphOrigin(event.currentTarget))}
        aria-hidden={addHidden || undefined}
        tabIndex={addHidden ? -1 : undefined}
        // Gleitet mit, wenn sich die Tab-Leiste daneben verbreitert.
        layout="position"
        whileTap={{ scale: 0.9 }}
        transition={spring}
        className={cn(
          addHidden && 'invisible',
          'pointer-events-auto flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-violet-500/40 ring-1 ring-white/30 focus-visible:ring-4 focus-visible:ring-violet-500/50 focus-visible:outline-none dark:shadow-violet-500/30',
        )}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
      </motion.button>
    </motion.div>
  );
}
