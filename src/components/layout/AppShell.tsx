import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

/** Seitenrahmen mit weichen Farbflächen hinter den Glas-Karten. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/15" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-rose-300/25 blur-3xl dark:bg-rose-500/10" />
      </div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:px-6">
        {children}
      </div>
    </div>
  );
}
