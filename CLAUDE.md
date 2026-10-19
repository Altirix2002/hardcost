\# Project: SubPulse (Abo-Manager PWA)



\## Tech-Stack \& Frameworks

\- \*\*Core:\*\* Vite + React (TypeScript, Strict Mode)

\- \*\*Styling:\*\* Tailwind CSS (keine Inline-Styles, Glassmorphism via Utility-Classes)

\- \*\*Icons:\*\* `lucide-react` (ausschliesslich)

\- \*\*State \& Storage:\*\* Zustand + Dexie.js (IndexedDB, Local-First)

\- \*\*Animations:\*\* `framer-motion` (weiche Apple-Style Federn und Morphs)

\- \*\*PWA:\*\* `vite-plugin-pwa`

\- \*\*Charts:\*\* Minimalistischer SVG-Linegraph oder `recharts` (schlank halten)

\- \*\*Currency API:\*\* Frankfurter API (`https://api.frankfurter.dev/v1/latest`; die alte `.app`-Domain leitet ohne CORS-Header um)



\## Coding-Standards \& Regeln

1\. \*\*Komponenten:\*\* Klein, modular, rein funktional in `src/components/`. Trenne UI von Berechnungslogik (`src/utils/calculations.ts`).

2\. \*\*Design-Vorgabe (Liquid Glass):\*\*

&#x20;  - Transluzente Karten (`bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md`).

&#x20;  - Feine Rahmen (`border border-white/20 dark:border-white/10`).

&#x20;  - Abgerundete Apple-Ecken (`rounded-2xl` bis `rounded-3xl`).

&#x20;  - Weiche Schatten und fliessende Hover-Effekte.

3\. \*\*Typisierung:\*\* Alle Datenstrukturen zwingend in `src/types/index.ts` typisieren. Keine Verwendung von `any`.

4\. \*\*Token-Disziplin:\*\* Vor dem Erstellen neuer UI-Komponenten bestehende Hilfsfunktionen wiederverwenden. Keine unaufgeforderten Gross-Refactorings.

5\. \*\*Abschluss-Routine:\*\* Nach jeder abgeschlossenen Änderung oder Aufgabe immer selbstständig `npm run lint` und `npm run build` ausführen und direkt einen passenden Git-Commit erstellen. Schlägt Lint oder Build fehl, zuerst die Fehler beheben und erst dann committen.



\## Wichtige Befehle

\- Dev-Server starten: `npm run dev`

\- TypeScript \& Lint-Check: `npm run lint`

\- Production Build: `npm run build`

\- Vorschau: `npm run preview`

