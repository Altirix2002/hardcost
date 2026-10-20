import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, Moon, Play, Trash2, type LucideIcon } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';
import type { ToastKind } from '../../types';
import { cn } from '../../utils/cn';
import { bounceSpring, spring } from '../../utils/motion';

const ICONS: Record<ToastKind, { icon: LucideIcon; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-emerald-400' },
  paused: { icon: Moon, className: 'text-amber-300' },
  resumed: { icon: Play, className: 'text-sky-300' },
  deleted: { icon: Trash2, className: 'text-rose-400' },
  info: { icon: Info, className: 'text-sky-300' },
};

/** Schwebende, tiefschwarze Statuspille oben in der Mitte – federt herein und verengt sich beim Gehen. */
export function DynamicIsland() {
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);
  const { icon: Icon, className: iconClassName } = ICONS[toast?.kind ?? 'info'];

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] flex justify-center px-4">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            layout
            role="status"
            aria-live="polite"
            initial={{ scale: 0.8, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -20, opacity: 0, transition: { duration: 0.2 } }}
            transition={spring}
            className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-white/10 bg-black/85 py-2.5 pr-3 pl-4 text-sm font-medium text-white shadow-2xl shadow-black/40 inset-shadow-2xs inset-shadow-white/15 backdrop-blur-2xl"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...bounceSpring, delay: 0.08 }}
              className={cn('shrink-0', iconClassName)}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </motion.span>
            <span className={cn('min-w-0 truncate', !toast.action && 'pr-2')}>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onPress();
                  dismiss();
                }}
                className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
