import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { AppTab } from '../../types';
import { spring } from '../../utils/motion';
import { TabBar } from './TabBar';

interface MobileDockProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onAdd: () => void;
  /** Gleiche layoutId wie das Erfassen-Fenster: Der Knopf morpht in das Formular und zurück. */
  addLayoutId?: string;
}

/**
 * Unten fixiertes Dock fürs Handy: Tab-Leiste plus runder Hinzufügen-Button.
 * Bewusst nur verschoben, nicht ausgeblendet – Deckkraft unter 100 % würde den Glas-Blur
 * der Tab-Leiste abschalten, bis die Animation ganz ausgeschwungen ist.
 */
export function MobileDock({ activeTab, onTabChange, onAdd, addLayoutId }: MobileDockProps) {
  return (
    <motion.div
      initial={{ y: 128 }}
      animate={{ y: 0 }}
      exit={{ y: 128 }}
      transition={spring}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
    >
      <TabBar activeTab={activeTab} onChange={onTabChange} layoutId="tab-mobile" compact className="pointer-events-auto" />
      <motion.button
        type="button"
        aria-label="Abo hinzufügen"
        onClick={onAdd}
        // Mit layoutId morpht der Knopf in Grösse und Lage (Formular ↔ Knopf); sonst nur mitgleiten,
        // wenn sich die Tab-Leiste daneben verbreitert.
        layout={addLayoutId ? true : 'position'}
        layoutId={addLayoutId}
        whileTap={{ scale: 0.9 }}
        transition={spring}
        // Radius als Motion-Wert, damit er beim Morph sauber in die Sheet-Ecken übergeht.
        style={{ borderRadius: 26 }}
        className="pointer-events-auto flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-violet-500/40 ring-1 ring-white/30 focus-visible:ring-4 focus-visible:ring-violet-500/50 focus-visible:outline-none dark:shadow-violet-500/30"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
      </motion.button>
    </motion.div>
  );
}
