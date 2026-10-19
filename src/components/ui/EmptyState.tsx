import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <GlassCard className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400/20 to-violet-500/20 text-sky-600 dark:text-sky-300">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </GlassCard>
  );
}
