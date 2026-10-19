import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SelectOption } from '../../types';
import { cn } from '../../utils/cn';
import { FIELD_BORDER, FIELD_ERROR, FIELD_LABEL, FIELD_SURFACE } from '../../utils/fieldStyles';
import { FieldMessage } from './FieldMessage';

interface SelectProps<T extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  hint?: string;
  error?: string;
}

/** Natives Select im Glas-Look – auf Mobilgeräten erscheint der System-Picker. */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  error,
  className,
  id,
  ...rest
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={selectId} className={FIELD_LABEL}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(event) => {
            const next = options.find((option) => option.value === event.target.value);
            if (next) onChange(next.value);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            FIELD_SURFACE,
            error ? FIELD_ERROR : FIELD_BORDER,
            'h-12 appearance-none truncate pr-10 pl-4',
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
      </div>
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  );
}
