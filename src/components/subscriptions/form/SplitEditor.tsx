import { Users } from 'lucide-react';
import type { CostSplit, CostSplitType, DraftValidation, SubscriptionDraft } from '../../../types';
import { applySplit } from '../../../utils/calculations';
import { cn } from '../../../utils/cn';
import { INSET_PANEL } from '../../../utils/fieldStyles';
import { formatCurrency } from '../../../utils/format';
import { parseAmount } from '../../../utils/subscriptionDraft';
import { Collapse } from '../../ui/Collapse';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { TextField } from '../../ui/TextField';
import { Toggle } from '../../ui/Toggle';

type SplitPatch = Partial<Pick<SubscriptionDraft, 'isShared' | 'splitType' | 'splitPeople' | 'splitAmount'>>;

interface SplitEditorProps {
  draft: SubscriptionDraft;
  errors: DraftValidation['fields'];
  onChange: (patch: SplitPatch) => void;
}

const SPLIT_OPTIONS = [
  { value: 'equal' as const, label: 'Gleichmässig' },
  { value: 'fixed' as const, label: 'Fester Betrag' },
];

/** Kosten-Splitting: Nur der eigene Anteil fliesst in die Summen ein. */
export function SplitEditor({ draft, errors, onChange }: SplitEditorProps) {
  const current = draft.intervals.find((i) => i.endDate === '');
  const price = parseAmount(current?.amount ?? '');
  const currency = current?.currency ?? draft.currency;

  const people = Number(draft.splitPeople.trim());
  const fixed = parseAmount(draft.splitAmount);
  const split: CostSplit | null =
    draft.splitType === 'equal'
      ? Number.isInteger(people) && people >= 2
        ? { type: 'equal', people }
        : null
      : fixed !== null && fixed > 0 && price !== null && fixed <= price
        ? { type: 'fixed', amount: fixed }
        : null;
  const preview = price !== null && split ? applySplit(split, price) : null;

  return (
    <div>
      <Toggle
        label="Abo mit anderen teilen"
        description="Nur dein Anteil zählt zu deinen Kosten."
        checked={draft.isShared}
        onChange={(isShared) => onChange({ isShared })}
      />
      <Collapse open={draft.isShared}>
        <div className="flex flex-col gap-4">
          <SegmentedControl
            options={SPLIT_OPTIONS}
            value={draft.splitType}
            onChange={(splitType: CostSplitType) => onChange({ splitType })}
            layoutId="split-type"
            ariaLabel="Art der Aufteilung"
          />
          {draft.splitType === 'equal' ? (
            <TextField
              label="Anzahl Personen"
              hint="Inklusive dir"
              inputMode="numeric"
              value={draft.splitPeople}
              onChange={(event) => onChange({ splitPeople: event.target.value })}
              error={errors.splitPeople}
            />
          ) : (
            <TextField
              label={`Dein Betrag pro Abrechnung (${currency})`}
              placeholder="z.B. 5.95"
              inputMode="decimal"
              value={draft.splitAmount}
              onChange={(event) => onChange({ splitAmount: event.target.value })}
              error={errors.splitAmount}
            />
          )}
          {price !== null && (
            <div className={cn(INSET_PANEL, 'flex items-center gap-3 py-3')}>
              <Users className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Dein Anteil:{' '}
                <span className="font-semibold text-zinc-900 tabular-nums dark:text-white">
                  {preview !== null ? formatCurrency(preview, currency) : '–'}
                </span>{' '}
                von <span className="tabular-nums">{formatCurrency(price, currency)}</span>
              </p>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
}
