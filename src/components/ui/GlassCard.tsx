import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  /** Aktiviert Hover-Lift und Tap-Feedback. */
  interactive?: boolean;
}

export function GlassCard({ interactive = false, className, children, ...rest }: GlassCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -2, scale: 1.005 } : undefined}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      transition={spring}
      className={cn(
        'rounded-3xl border border-white/20 bg-white/70 shadow-lg shadow-zinc-900/5 backdrop-blur-md',
        'dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-black/30',
        interactive && 'cursor-pointer transition-shadow duration-300 hover:shadow-xl',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
