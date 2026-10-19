import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { CategoryColor } from '../../types';
import { CATEGORY_COLORS, CATEGORY_COLOR_CLASSES, CATEGORY_COLOR_LABELS } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { FIELD_LABEL } from '../../utils/fieldStyles';
import { spring } from '../../utils/motion';

interface ColorSwatchPickerProps {
  label: string;
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
}

export function ColorSwatchPicker({ label, value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className={FIELD_LABEL}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2 px-1">
        {CATEGORY_COLORS.map((color) => {
          const selected = color === value;
          return (
            <motion.button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={CATEGORY_COLOR_LABELS[color]}
              title={CATEGORY_COLOR_LABELS[color]}
              onClick={() => onChange(color)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={spring}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-white dark:ring-offset-zinc-900',
                CATEGORY_COLOR_CLASSES[color].solid,
                selected && 'ring-2 ring-zinc-900 dark:ring-white',
              )}
            >
              {selected && <Check className="h-4 w-4 text-white" aria-hidden />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
