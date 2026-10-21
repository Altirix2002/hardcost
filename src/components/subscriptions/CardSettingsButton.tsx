import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface CardSettingsButtonProps {
  label: string;
  onPress: () => void;
  size?: 'sm' | 'md';
}

/**
 * Zahnrad oben links auf der Karte: liegt wie ein Knopf auf (eigener Schlagschatten), sitzt ausserhalb
 * der drehenden Fläche und bleibt beim Umdrehen stehen. Öffnet nur die Abo-Einstellungen.
 */
export function CardSettingsButton({ label, onPress, size = 'md' }: CardSettingsButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onPress();
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      transition={spring}
      className={cn(
        'absolute z-10 flex items-center justify-center rounded-full border border-white/60 bg-white text-zinc-600',
        'shadow-[0_3px_8px_-1px_rgba(24,24,27,0.28),0_1px_2px_rgba(24,24,27,0.18)] touch-manipulation',
        'focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:outline-none',
        'dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200 dark:shadow-[0_3px_10px_-1px_rgba(0,0,0,0.6)]',
        size === 'sm' ? '-top-1.5 -left-1.5 h-6 w-6' : '-top-2 -left-2 h-7 w-7',
      )}
    >
      <Settings className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
    </motion.button>
  );
}
