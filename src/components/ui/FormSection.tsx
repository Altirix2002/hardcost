import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="px-1">
        <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">{title}</h3>
        {description && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}
