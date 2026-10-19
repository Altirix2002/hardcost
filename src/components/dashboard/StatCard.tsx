import type { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </GlassCard>
  );
}
