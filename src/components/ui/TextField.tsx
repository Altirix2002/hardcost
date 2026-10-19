import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, className, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const description = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'h-12 rounded-2xl border border-zinc-900/10 bg-white/60 px-4 text-base backdrop-blur-md transition',
          'placeholder:text-zinc-400 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/15 focus:outline-none',
          'dark:border-white/10 dark:bg-zinc-800/60 dark:placeholder:text-zinc-500',
          error && 'border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/15',
          className,
        )}
        {...rest}
      />
      {description && (
        <p
          id={descriptionId}
          className={cn('px-1 text-xs', error ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500')}
        >
          {description}
        </p>
      )}
    </div>
  );
}
