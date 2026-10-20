import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { sheetSpring } from '../../utils/motion';

interface AutoHeightProps {
  children: ReactNode;
}

/**
 * Animiert Höhenänderungen des Inhalts per Feder – z.B. beim Wechsel zwischen unterschiedlich
 * hohen Ansichten. So gleitet ein Bottom-Sheet auf die neue Grösse, statt zu springen.
 */
export function AutoHeight({ children }: AutoHeightProps) {
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
    <motion.div initial={false} animate={{ height }} transition={sheetSpring} className="-mx-1 overflow-hidden px-1">
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}
