import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { spring } from '../../utils/motion';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** Gleiche layoutId wie das Fenster, das der Knopf öffnet (Morph-Animation). */
  layoutId?: string;
}

export function FloatingActionButton({ icon: Icon, label, onClick, layoutId }: FloatingActionButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      layoutId={layoutId}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      // Radius als Motion-Wert, damit er beim Morph sauber in die Fenster-Ecken übergeht.
      style={{ borderRadius: 28 }}
      className="fixed right-8 bottom-8 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-xl shadow-violet-500/40 ring-1 ring-white/30 focus-visible:ring-4 focus-visible:ring-violet-500/50 focus-visible:outline-none sm:flex dark:shadow-violet-500/30"
    >
      <Icon className="h-6 w-6" strokeWidth={2.5} aria-hidden />
    </motion.button>
  );
}
