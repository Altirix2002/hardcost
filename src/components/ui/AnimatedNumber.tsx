import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AnimatedNumberProps {
  value: number;
  /** Formatierung pro Frame; bei Wechsel (z.B. Währung) die Komponente per `key` neu mounten. */
  format: (value: number) => string;
  className?: string;
}

/** Zahl, die bei Änderungen per Feder weich hoch- bzw. runterzählt. */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const text = useTransform(motionValue, format);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }
    // Leicht überkritisch gedämpft: zählt flüssig, ohne über das Ziel hinauszuschiessen.
    const controls = animate(motionValue, value, { type: 'spring', stiffness: 90, damping: 20, restDelta: 0.005 });
    return () => controls.stop();
  }, [motionValue, value, reduceMotion]);

  return <motion.span className={cn('tabular-nums', className)}>{text}</motion.span>;
}
