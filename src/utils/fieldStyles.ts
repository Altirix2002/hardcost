/** Gemeinsame Glas-Optik für Eingabefelder (ohne Rahmenfarbe, Höhe und Padding). */
export const FIELD_SURFACE =
  'w-full rounded-2xl border bg-white/60 text-base backdrop-blur-md transition focus:ring-4 focus:outline-none ' +
  'placeholder:text-zinc-400 dark:bg-zinc-800/60 dark:placeholder:text-zinc-500';

// Rahmenfarben sind exklusiv: entweder normal oder Fehler, nie beide (sonst entscheidet die CSS-Reihenfolge).
export const FIELD_BORDER = 'border-zinc-900/10 focus:border-sky-500/50 focus:ring-sky-500/15 dark:border-white/10';

export const FIELD_ERROR = 'border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/15';

export const FIELD_LABEL = 'px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300';

/** Eingebettete Fläche innerhalb von Glas-Panels (z.B. Preis-Zeilen, Inline-Formulare). */
export const INSET_PANEL = 'rounded-2xl border border-zinc-900/10 bg-white/50 p-4 dark:border-white/10 dark:bg-zinc-800/40';
