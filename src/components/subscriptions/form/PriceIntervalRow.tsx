import { Trash2 } from 'lucide-react';
import type { DraftValidation, PriceIntervalDraft, PriceIntervalPatch } from '../../../types';
import { cn } from '../../../utils/cn';
import { INSET_PANEL } from '../../../utils/fieldStyles';
import { CURRENCY_CODE_OPTIONS } from '../../../utils/options';
import { Badge } from '../../ui/Badge';
import { IconButton } from '../../ui/IconButton';
import { Select } from '../../ui/Select';
import { TextField } from '../../ui/TextField';

interface PriceIntervalRowProps {
  interval: PriceIntervalDraft;
  errors?: DraftValidation['intervals'][string];
  canRemove: boolean;
  onChange: (patch: PriceIntervalPatch) => void;
  onRemove: () => void;
}

export function PriceIntervalRow({ interval, errors, canRemove, onChange, onRemove }: PriceIntervalRowProps) {
  const isCurrent = interval.endDate === '';

  return (
    <div className={cn(INSET_PANEL, 'flex flex-col gap-3')}>
      <div className="flex min-h-6 items-center justify-between">
        {isCurrent ? (
          <Badge color="emerald">Aktuell gültig</Badge>
        ) : (
          <span className="px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Früherer Preis</span>
        )}
        {canRemove && <IconButton icon={Trash2} label="Preis entfernen" onClick={onRemove} className="-my-2 -mr-2" />}
      </div>
      <div className="grid grid-cols-2 items-start gap-3">
        <TextField
          type="date"
          label="Startdatum"
          value={interval.startDate}
          onChange={(event) => onChange({ startDate: event.target.value })}
          error={errors?.startDate}
        />
        <TextField
          type="date"
          label="Enddatum"
          value={interval.endDate}
          onChange={(event) => onChange({ endDate: event.target.value })}
          hint={isCurrent ? 'Leer = läuft weiter' : undefined}
          error={errors?.endDate}
        />
        <TextField
          label="Betrag"
          inputMode="decimal"
          placeholder="0.00"
          autoComplete="off"
          value={interval.amount}
          onChange={(event) => onChange({ amount: event.target.value })}
          error={errors?.amount}
        />
        <Select
          label="Währung"
          value={interval.currency}
          options={CURRENCY_CODE_OPTIONS}
          onChange={(currency) => onChange({ currency })}
          error={errors?.currency}
        />
      </div>
    </div>
  );
}
