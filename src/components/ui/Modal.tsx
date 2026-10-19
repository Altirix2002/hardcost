import { useEffect, useId, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { sheetSpring } from '../../utils/motion';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Bottom-Sheet auf Mobile, zentriertes Glas-Panel ab `sm`. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();

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
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.98 }}
            transition={sheetSpring}
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/20 bg-white/80 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl sm:rounded-3xl dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id={titleId} className="text-xl font-semibold tracking-tight">
                {title}
              </h2>
              <IconButton icon={X} label="Schliessen" onClick={onClose} className="-mr-2" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
