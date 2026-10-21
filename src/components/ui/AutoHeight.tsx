import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { sheetSpring } from '../../utils/motion';

interface AutoHeightProps {
  children: ReactNode;
  /** Äussere Klassen, z.B. negative Ränder oben/unten für Schatten/Hover, die der Zuschnitt sonst abschneidet. */
  className?: string;
  /** Polster gehört ans innere, gemessene Element – am äusseren verfälschte es die animierte Höhe. */
  innerClassName?: string;
}

/**
 * Animiert Höhenänderungen des Inhalts per Feder – z.B. beim Wechsel zwischen unterschiedlich
 * hohen Ansichten. So gleitet ein Bottom-Sheet auf die neue Grösse, statt zu springen.
 * Abgeschnitten wird nur oben/unten (overflow-y: clip) – seitlich bleiben Schatten, Glow und
 * überstehende Knöpfe sichtbar.
 */
export function AutoHeight({ children, className = '-mx-1 px-1', innerClassName }: AutoHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useLayoutEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.borderBoxSize[0]?.blockSize ?? element.offsetHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div initial={false} animate={{ height }} transition={sheetSpring} className={cn('overflow-x-visible overflow-y-clip', className)}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </motion.div>
  );
}
