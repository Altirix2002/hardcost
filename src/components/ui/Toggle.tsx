import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** iOS-artiger Schalter mit federndem Knopf. */
export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 text-left focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-zinc-500 dark:text-zinc-400">{description}</span>}
      </span>
      <span
        className={cn(
          'flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300',
          checked ? 'justify-end bg-emerald-500' : 'justify-start bg-zinc-900/15 dark:bg-white/15',
        )}
      >
        <motion.span layout transition={spring} className="h-6 w-6 rounded-full bg-white shadow-md" />
      </span>
    </button>
  );
}
