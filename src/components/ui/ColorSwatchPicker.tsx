import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { CategoryColor } from '../../types';
import {
  CATEGORY_HUES,
  CATEGORY_HUE_LABELS,
  CATEGORY_TONES,
  CATEGORY_TONE_LABELS,
  getCategoryColorClasses,
  parseCategoryColor,
  toCategoryColor,
} from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { FIELD_LABEL } from '../../utils/fieldStyles';
import { spring } from '../../utils/motion';
import { SegmentedControl } from './SegmentedControl';

interface ColorSwatchPickerProps {
  label: string;
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
}

const TONE_OPTIONS = CATEGORY_TONES.map((tone) => ({ value: tone, label: CATEGORY_TONE_LABELS[tone] }));

/** Farbton-Raster plus Helligkeitsstufe – 19 Töne × 3 Stufen. */
export function ColorSwatchPicker({ label, value, onChange }: ColorSwatchPickerProps) {
  const { hue: selectedHue, tone } = parseCategoryColor(value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={FIELD_LABEL}>{label}</span>
        <SegmentedControl
          options={TONE_OPTIONS}
          value={tone}
          onChange={(nextTone) => onChange(toCategoryColor(selectedHue, nextTone))}
          layoutId="color-tone"
          ariaLabel="Helligkeit"
        />
      </div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-2 px-1">
        {CATEGORY_HUES.map((hue) => {
          const color = toCategoryColor(hue, tone);
          const classes = getCategoryColorClasses(color);
          const selected = hue === selectedHue;
          return (
            <motion.button
              key={hue}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={CATEGORY_HUE_LABELS[hue]}
              title={CATEGORY_HUE_LABELS[hue]}
              onClick={() => onChange(color)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={spring}
              className={cn(
                'flex aspect-square w-full max-w-8 items-center justify-center justify-self-center rounded-full ring-offset-2 ring-offset-white transition-colors dark:ring-offset-zinc-900',
                classes.solid,
                selected && 'ring-2 ring-zinc-900 dark:ring-white',
              )}
            >
              {selected && <Check className={cn('h-4 w-4', classes.onSolid)} aria-hidden />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
