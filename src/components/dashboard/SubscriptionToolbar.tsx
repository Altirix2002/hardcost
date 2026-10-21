import { motion } from 'framer-motion';
import { ArrowDownAZ, CalendarClock, Check, Coins, GripVertical, LayoutGrid, Move, Rows3 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';
import type { SubscriptionSortKey, SubscriptionStatusFilter, SubscriptionViewMode } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';

interface SubscriptionToolbarProps {
  count: number;
  sortKey: SubscriptionSortKey;
  onSortChange: (sortKey: SubscriptionSortKey) => void;
  statusFilter: SubscriptionStatusFilter;
  onStatusFilterChange: (statusFilter: SubscriptionStatusFilter) => void;
  viewMode: SubscriptionViewMode;
  onViewModeChange: (viewMode: SubscriptionViewMode) => void;
  reordering: boolean;
  onReorderingChange: (reordering: boolean) => void;
}

const VIEW_OPTIONS = [
  { value: 'list' as const, label: 'Liste', icon: Rows3 },
  { value: 'tiles' as const, label: 'Kacheln', icon: LayoutGrid },
];

const SORT_OPTIONS = [
  { value: 'due' as const, label: 'Fälligkeit', icon: CalendarClock },
  { value: 'cost' as const, label: 'Kosten', icon: Coins },
  { value: 'name' as const, label: 'Name', icon: ArrowDownAZ },
  { value: 'manual' as const, label: 'Eigene Reihenfolge', icon: GripVertical },
];

const STATUS_OPTIONS = [
  { value: 'all' as const, label: 'Alle' },
  { value: 'active' as const, label: 'Aktiv' },
  { value: 'paused' as const, label: 'Pausiert' },
  { value: 'cancelled' as const, label: 'Gekündigt' },
];

export function SubscriptionToolbar({
  count,
  sortKey,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  reordering,
  onReorderingChange,
}: SubscriptionToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="px-1 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Deine Abos <span className="font-normal tabular-nums">({count})</span>
        </h2>
        {sortKey === 'manual' && (
          <motion.button
            type="button"
            onClick={() => onReorderingChange(!reordering)}
            aria-pressed={reordering}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.94 }}
            transition={spring}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:outline-none',
              reordering
                ? 'bg-brand-gradient text-white shadow-md shadow-violet-500/30'
                : 'border border-white/20 bg-white/60 text-zinc-700 hover:bg-white/80 dark:border-white/10 dark:bg-zinc-800/60 dark:text-zinc-200',
            )}
          >
            {reordering ? <Check className="h-4 w-4" aria-hidden /> : <Move className="h-4 w-4" aria-hidden />}
            {reordering ? 'Fertig' : 'Anordnen'}
          </motion.button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          layoutId="status-filter"
          ariaLabel="Abos filtern"
        />
        <SegmentedControl
          options={SORT_OPTIONS}
          value={sortKey}
          onChange={onSortChange}
          layoutId="sort-key"
          ariaLabel="Sortieren nach"
          iconOnly
        />
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
          layoutId="view-mode"
          ariaLabel="Ansicht"
          iconOnly
        />
      </div>
    </div>
  );
}
