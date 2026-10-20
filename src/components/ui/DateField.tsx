import { useId, type MouseEvent } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { parseISODate } from '../../utils/dates';
import { FIELD_BORDER, FIELD_ERROR, FIELD_LABEL, FIELD_SURFACE } from '../../utils/fieldStyles';
import { formatDate } from '../../utils/format';
import { isValidISODate } from '../../utils/subscriptionDraft';
import { FieldMessage } from './FieldMessage';

interface DateFieldProps {
  label: string;
  value: string; // YYYY-MM-DD oder ''
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  min?: string;
  /** Zeigt ein ✕ zum Leeren (für optionale Daten wie "Pausiert bis"). */
  clearable?: boolean;
  placeholder?: string;
}

/**
 * Datumsfeld mit eigener Anzeige ("20. Okt. 2026") über einem unsichtbaren nativen Datumsfeld.
 * Grund: Chrome auf Windows übernimmt das System-Datumsformat und zeigt dabei je nach Einstellung
 * einen verwaisten Trenner (",20.10.2026"). Der native Wähler bleibt erhalten – auf dem Handy per
 * Antippen, am Desktop per showPicker().
 */
export function DateField({ label, value, onChange, hint, error, min, clearable = false, placeholder = 'Datum wählen' }: DateFieldProps) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const hasValue = isValidISODate(value);

  const openPicker = (event: MouseEvent<HTMLInputElement>) => {
    try {
      event.currentTarget.showPicker();
    } catch {
      // Nicht unterstützt oder schon offen – der Browser öffnet dann selbst.
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className={FIELD_LABEL}>
        {label}
      </label>
      {/* overflow-hidden: iOS gibt nativen Datumsfeldern eine Mindestbreite, die sonst übersteht. */}
      <div className="relative overflow-hidden rounded-2xl">
        <input
          id={inputId}
          type="date"
          value={value}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          onClick={openPicker}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none text-base opacity-0"
        />
        <div
          aria-hidden
          className={cn(
            FIELD_SURFACE,
            error ? FIELD_ERROR : FIELD_BORDER,
            'pointer-events-none flex h-12 items-center gap-2 px-4',
            'peer-focus-visible:ring-4',
            error ? 'peer-focus-visible:ring-rose-500/15' : 'peer-focus-visible:border-sky-500/50 peer-focus-visible:ring-sky-500/15',
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          <span className={cn('min-w-0 truncate', !hasValue && 'text-zinc-400 dark:text-zinc-500')}>
            {hasValue ? formatDate(parseISODate(value), true) : placeholder}
          </span>
        </div>
        {clearable && value !== '' && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={`${label} leeren`}
            className="absolute top-1/2 right-2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-900/5 hover:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  );
}
