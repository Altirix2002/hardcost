import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { springWithFade } from '../../utils/motion';

interface RollingValueProps {
  /** Wechselt dieser Schlüssel, rollt der alte Inhalt weg und der neue herein. */
  rollKey: string | number;
  /** Bei Zahlen: Steigt der Wert, rollt er von unten herein, fällt er, von oben. */
  numeric?: number;
  children: ReactNode;
}

const ROLL: Variants = {
  enter: (direction: number) => ({ y: `${direction * 70}%`, opacity: 0 }),
  center: { y: '0%', opacity: 1 },
  exit: (direction: number) => ({ y: `${direction * -70}%`, opacity: 0 }),
};

/**
 * Wechselnde Werte (z.B. "nächste Abbuchung" eines anderen Abos) rollen wie auf einer Anzeigetafel,
 * statt durch Zwischenwerte zu zählen – die passen nämlich zu keinem Abo. Der Elternblock braucht
 * `relative` und `overflow-hidden` (bzw. `truncate`), damit der ausrollende Wert abgeschnitten wird.
 */
export function RollingValue({ rollKey, numeric, children }: RollingValueProps) {
  // Vorherigen Wert im State merken (StrictMode-sicher, anders als eine beim Rendern veränderte Ref).
  const [previous, setPrevious] = useState(numeric);
  const [direction, setDirection] = useState(1);
  if (numeric !== previous) {
    setDirection(numeric !== undefined && previous !== undefined && numeric < previous ? -1 : 1);
    setPrevious(numeric);
  }

  return (
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      <motion.span
        key={rollKey}
        custom={direction}
        variants={ROLL}
        initial="enter"
        animate="center"
        exit="exit"
        transition={springWithFade}
        className="block"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
