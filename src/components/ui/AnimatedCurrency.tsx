import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { formatCurrency } from '../../utils/format';

interface AnimatedCurrencyProps {
  value: number;
  currency: string;
  className?: string;
}

/** Betrag, der bei Änderungen weich hoch- bzw. runterzählt. Bei Währungswechsel per `key` neu mounten. */
export function AnimatedCurrency({ value, currency, className }: AnimatedCurrencyProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const text = useTransform(motionValue, (latest) => formatCurrency(latest, currency));

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }
    // Leicht überkritisch gedämpft: zählt flüssig, ohne über das Ziel hinauszuschiessen.
    const controls = animate(motionValue, value, { type: 'spring', stiffness: 90, damping: 20, restDelta: 0.005 });
    return () => controls.stop();
  }, [motionValue, value, reduceMotion]);

  return <motion.span className={className}>{text}</motion.span>;
}
