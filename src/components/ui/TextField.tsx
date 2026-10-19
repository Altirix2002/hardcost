import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { FIELD_BORDER, FIELD_ERROR, FIELD_LABEL, FIELD_SURFACE } from '../../utils/fieldStyles';
import { FieldMessage } from './FieldMessage';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, className, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className={FIELD_LABEL}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(FIELD_SURFACE, error ? FIELD_ERROR : FIELD_BORDER, 'h-12 min-w-0 px-4', className)}
        {...rest}
      />
      <FieldMessage id={messageId} hint={hint} error={error} />
    </div>
  );
}
