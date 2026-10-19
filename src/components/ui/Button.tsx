import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:shadow-black/40 dark:hover:bg-zinc-100',
  secondary:
    'border border-white/20 bg-white/60 text-zinc-900 backdrop-blur-md hover:bg-white/80 dark:border-white/10 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800/80',
  ghost: 'text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10',
  danger: 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3 text-sm',
  md: 'h-11 gap-2 rounded-2xl px-4 text-sm',
  lg: 'h-13 gap-2 rounded-2xl px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-200',
        'focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </motion.button>
  );
}
