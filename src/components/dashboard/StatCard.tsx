import type { ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { GlassCard } from '../ui/GlassCard';

interface StatCardProps {
  label: string;
  /** Text oder z.B. ein AnimatedCurrency-Ticker. */
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  /** Macht die Karte antippbar (z.B. für eine Detailansicht). */
  onClick?: () => void;
  /** Reserviert Platz für zwei Hinweiszeilen, damit die Karte beim Textwechsel nicht springt. */
  reserveHintLines?: boolean;
}

export function StatCard({ label, value, icon: Icon, hint, onClick, reserveHintLines = false }: StatCardProps) {
  const interactive = onClick !== undefined;

  return (
    <GlassCard
      interactive={interactive}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onClick();
            }
          : undefined
      }
      className={cn(
        'p-5',
        interactive && 'focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none',
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {interactive && <ChevronRight className="-mr-1 h-4 w-4 shrink-0" aria-hidden />}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</p>
      {hint && (
        <p className={cn('mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400', reserveHintLines && 'min-h-8')}>
          {hint}
        </p>
      )}
    </GlassCard>
  );
}
