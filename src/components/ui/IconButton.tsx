import { motion, type HTMLMotionProps } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: LucideIcon;
  /** Pflicht, da der Button keinen sichtbaren Text hat. */
  label: string;
}

export function IconButton({ icon: Icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors',
        'hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10',
        'focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none',
        className,
      )}
      {...rest}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </motion.button>
  );
}
