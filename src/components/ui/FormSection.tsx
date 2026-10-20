import type { ReactNode } from 'react';

interface FormSectionProps {
  /** Sprungziel, z.B. für "Jetzt sichern" aus der Backup-Erinnerung. */
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ id, title, description, children }: FormSectionProps) {
  return (
    <section id={id} className="flex scroll-mt-4 flex-col gap-4">
      <div className="px-1">
        <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">{title}</h3>
        {description && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}
