import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Eindeutige ID für den gleitenden Hintergrund (framer-motion layoutId). */
  layoutId: string;
  ariaLabel: string;
  /** Zeigt nur Icons; Labels bleiben für Screenreader erhalten. */
  iconOnly?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  ariaLabel,
  iconOnly = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-full border border-white/20 bg-zinc-900/5 p-1 sm:backdrop-blur-md dark:border-white/10 dark:bg-white/10"
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={iconOnly ? label : undefined}
            title={iconOnly ? label : undefined}
            onClick={() => onChange(optionValue)}
            className={cn(
              'relative flex h-8 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors',
              iconOnly ? 'w-8' : 'px-3',
              active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-zinc-700"
              />
            )}
            {Icon && <Icon className="relative h-4 w-4" aria-hidden />}
            {!iconOnly && <span className="relative">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
