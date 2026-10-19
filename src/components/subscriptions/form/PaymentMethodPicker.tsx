import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { spring } from '../../../utils/motion';
import { TextField } from '../../ui/TextField';

interface PaymentMethodPickerProps {
  value: string;
  /** Eigene (bereits verwendete) Zahlungsarten zuerst, danach die Standardvorschläge. */
  suggestions: string[];
  onChange: (value: string) => void;
}

const CHIP_BASE = 'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors';
const CHIP_IDLE =
  'border-zinc-900/10 bg-white/50 text-zinc-700 hover:bg-white/80 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800/80';
const CHIP_SELECTED = 'border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900';

/** Freitextfeld mit antippbaren Vorschlägen; neu eingetippte Zahlungsarten erscheinen beim nächsten Abo hier. */
export function PaymentMethodPicker({ value, suggestions, onChange }: PaymentMethodPickerProps) {
  const normalized = value.trim().toLocaleLowerCase('de-CH');

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Zahlungsart"
        placeholder="z.B. Twint oder eigene eintippen"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div role="radiogroup" aria-label="Zahlungsart wählen" className="flex flex-wrap gap-2">
        {suggestions.map((method) => {
          const selected = method.toLocaleLowerCase('de-CH') === normalized;
          return (
            <motion.button
              key={method}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? '' : method)}
              whileTap={{ scale: 0.94 }}
              transition={spring}
              className={cn(CHIP_BASE, selected ? CHIP_SELECTED : CHIP_IDLE)}
            >
              {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
              {method}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
