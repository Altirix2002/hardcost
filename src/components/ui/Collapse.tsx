import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sheetSpringWithFade } from '../../utils/motion';

interface CollapseProps {
  open: boolean;
  children: ReactNode;
}

/** Klappt Inhalt weich auf und zu (Höhe + Deckkraft). */
export function Collapse({ open, children }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={sheetSpringWithFade}
          className="-mx-1 overflow-hidden px-1"
        >
          {/* Innenabstand statt Gap: Die Höhe animiert so ohne Sprung auf und zu. */}
          <div className="pt-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
