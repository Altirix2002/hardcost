import { ArrowDownAZ, CalendarClock, Coins, LayoutGrid, Rows3 } from 'lucide-react';
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
}

const VIEW_OPTIONS = [
  { value: 'list' as const, label: 'Liste', icon: Rows3 },
  { value: 'tiles' as const, label: 'Kacheln', icon: LayoutGrid },
];

const SORT_OPTIONS = [
  { value: 'due' as const, label: 'Fälligkeit', icon: CalendarClock },
  { value: 'cost' as const, label: 'Kosten', icon: Coins },
  { value: 'name' as const, label: 'Name', icon: ArrowDownAZ },
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
}: SubscriptionToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="px-1 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Deine Abos <span className="font-normal tabular-nums">({count})</span>
      </h2>
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
