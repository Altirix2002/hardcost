import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface FieldMessageProps {
  id?: string;
  hint?: string;
  error?: string;
}

/** Hinweis- oder Fehlertext unter einem Feld; Fehler haben Vorrang. */
export function FieldMessage({ id, hint, error }: FieldMessageProps) {
  const message = error ?? hint;
  return (
    <AnimatePresence initial={false} mode="wait">
      {message && (
        <motion.p
          key={error ? `error-${error}` : 'hint'}
          id={id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={cn('px-1 text-xs', error ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400')}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
