import { useEffect, useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { sheetSpringWithFade } from '../../utils/motion';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Bleibt sichtbar, während der Inhalt scrollt (z.B. Speichern-Buttons). */
  footer?: ReactNode;
}

/** Spätestens dann ist die Schliess-Animation sicher vorbei. */
const EXIT_FALLBACK_MS = 900;

/** Bottom-Sheet auf Mobile, zentriertes Glas-Panel ab `sm`. */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const titleId = useId();
  // Sicherheitsnetz: Bleibt die Exit-Animation hängen (z.B. wenn auf dem Handy gleichzeitig die
  // Tastatur einfährt), würde das Sheet sichtbar, aber tot stehen bleiben. Ein neuer Key für
  // AnimatePresence räumt es dann zuverlässig ab.
  const [presenceKey, setPresenceKey] = useState(0);

  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => setPresenceKey((key) => key + 1), EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence key={presenceKey}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-zinc-950/40 sm:bg-zinc-950/30 sm:backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={sheetSpringWithFade}
            className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl sm:rounded-3xl dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-zinc-900/15 sm:hidden dark:bg-white/20" />
            <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-4 pb-4 sm:pt-6">
              <h2 id={titleId} className="text-xl font-semibold tracking-tight">
                {title}
              </h2>
              <IconButton icon={X} label="Schliessen" onClick={onClose} className="-mr-2" />
            </div>
            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-6',
                footer ? 'pb-6' : 'pb-[max(1.5rem,env(safe-area-inset-bottom))]',
              )}
            >
              {children}
            </div>
            {footer && (
              <div className="shrink-0 border-t border-zinc-900/5 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
