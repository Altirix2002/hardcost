import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { measureMorphOrigin } from '../../utils/morph';
import { spring } from '../../utils/motion';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  /** Bekommt die Lage des Knopfs – dort beginnt der Morph ins Fenster. */
  onClick: (origin: DOMRect) => void;
  /** Unsichtbar, solange das Fenster aus ihm herausgewachsen ist (Morph). */
  hidden?: boolean;
}

export function FloatingActionButton({ icon: Icon, label, onClick, hidden = false }: FloatingActionButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => onClick(measureMorphOrigin(event.currentTarget))}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className={cn(
        hidden && 'invisible',
        'fixed right-8 bottom-8 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-xl shadow-violet-500/40 ring-1 ring-white/30 focus-visible:ring-4 focus-visible:ring-violet-500/50 focus-visible:outline-none sm:flex dark:shadow-violet-500/30',
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={2.5} aria-hidden />
    </motion.button>
  );
}
