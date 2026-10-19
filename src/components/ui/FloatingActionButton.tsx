import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { spring } from '../../utils/motion';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function FloatingActionButton({ icon: Icon, label, onClick }: FloatingActionButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className="fixed right-8 bottom-8 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl shadow-zinc-900/30 ring-1 ring-white/20 focus-visible:ring-4 focus-visible:ring-sky-500/50 focus-visible:outline-none sm:flex dark:bg-white dark:text-zinc-900 dark:shadow-black/50"
    >
      <Icon className="h-6 w-6" strokeWidth={2.5} aria-hidden />
    </motion.button>
  );
}
