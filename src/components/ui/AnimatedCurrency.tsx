import { useCallback } from 'react';
import { formatCurrency } from '../../utils/format';
import { AnimatedNumber } from './AnimatedNumber';

interface AnimatedCurrencyProps {
  value: number;
  currency: string;
  className?: string;
}

/** Betrag, der bei Änderungen weich hoch- bzw. runterzählt. Bei Währungswechsel per `key` neu mounten. */
export function AnimatedCurrency({ value, currency, className }: AnimatedCurrencyProps) {
  const format = useCallback((latest: number) => formatCurrency(latest, currency), [currency]);
  return <AnimatedNumber value={value} format={format} className={className} />;
}
