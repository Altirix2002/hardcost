import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { FIELD_BORDER, FIELD_LABEL, FIELD_SURFACE } from '../../utils/fieldStyles';
import { FieldMessage } from './FieldMessage';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextArea({ label, hint, className, id, rows = 3, ...rest }: TextAreaProps) {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;
  const messageId = `${textAreaId}-message`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textAreaId} className={FIELD_LABEL}>
        {label}
      </label>
      <textarea
        id={textAreaId}
        rows={rows}
        aria-describedby={hint ? messageId : undefined}
        className={cn(FIELD_SURFACE, FIELD_BORDER, 'resize-none px-4 py-3', className)}
        {...rest}
      />
      <FieldMessage id={messageId} hint={hint} />
    </div>
  );
}
