import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { FIELD_BORDER, FIELD_SURFACE } from '../../utils/fieldStyles';
import { spring } from '../../utils/motion';

interface SubscriptionSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** Live-Suche über der Abo-Liste – Escape oder X leert das Feld. */
export function SubscriptionSearch({ value, onChange }: SubscriptionSearchProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        aria-label="Abos durchsuchen"
        placeholder="Suchen …"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onChange('');
          // Enter schliesst die Handy-Tastatur, damit die Treffer sichtbar werden.
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className={cn(
          FIELD_SURFACE,
          FIELD_BORDER,
          'h-12 pr-12 pl-11 [&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      <AnimatePresence>
        {value !== '' && (
          <motion.button
            type="button"
            aria-label="Suche leeren"
            onClick={() => onChange('')}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileTap={{ scale: 0.9 }}
            transition={spring}
            className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900/10 text-zinc-600 hover:bg-zinc-900/15 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
          >
            <X className="h-4 w-4" aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
