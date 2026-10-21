import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { animate, usePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../utils/cn';

interface MorphSheetProps {
  /** Lage des Plus-Knopfs beim Antippen – dort beginnt und endet der Morph. */
  origin: DOMRect;
  /** Schliess-Morph fertig: Jetzt darf der echte Knopf wieder erscheinen. */
  onMorphEnd?: () => void;
  className: string;
  children: ReactNode;
  labelledBy: string;
}

/** Öffnen: weich auslaufen wie eine Feder ohne Nachschwingen; Schliessen etwas zügiger. */
const OPEN = { duration: 0.46, ease: [0.22, 1, 0.36, 1] } as const;
const CLOSE = { duration: 0.34, ease: [0.4, 0, 0.2, 1] } as const;

/** Rundung des Sheets; als vier Werte, damit sie sich mit dem Knopf-Kreis interpolieren lässt. */
const RADIUS_MOBILE = '24px 24px 0px 0px';
const RADIUS_DESKTOP = '24px 24px 24px 24px';

function insetOf(sheet: DOMRect, button: DOMRect): string {
  const radius = `${button.height / 2}px`;
  return (
    `inset(${button.top - sheet.top}px ${sheet.right - button.right}px ` +
    `${sheet.bottom - button.bottom}px ${button.left - sheet.left}px ` +
    `round ${radius} ${radius} ${radius} ${radius})`
  );
}

/**
 * Liegt der Knopf ausserhalb des Fensters (Desktop: Knopf unten rechts, Fenster zentriert), startet das
 * Fenster so weit verschoben, dass der Knopf darin liegt, und gleitet währenddessen an seinen Platz.
 */
function shiftToContain(sheet: DOMRect, button: DOMRect): { x: number; y: number; box: DOMRect } {
  const x =
    button.right > sheet.right ? button.right - sheet.right : button.left < sheet.left ? button.left - sheet.left : 0;
  const y =
    button.bottom > sheet.bottom
      ? button.bottom - sheet.bottom
      : button.top < sheet.top
        ? button.top - sheet.top
        : 0;
  return { x, y, box: new DOMRect(sheet.left + x, sheet.top + y, sheet.width, sheet.height) };
}

/**
 * Plus-Knopf → Formular ohne Shared-Layout-Übergabe: Das Sheet steht von Anfang an in voller Grösse
 * da und wird per clip-path auf die Lage des Knopfs zugeschnitten, dann aufgezogen. Nichts wird
 * skaliert – Text bleibt scharf, und Chrome (Android) muss keinen skalierten Glas-Blur berechnen.
 * Zu Beginn liegt der Knopf-Look (Verlauf + Plus) obenauf und blendet ins Glas über; beim Schliessen
 * umgekehrt. Weil der Start erst im ersten gezeichneten Bild beginnt, kostet ein langsames
 * Einhängen des Formulars (Handy) keine Animationsbilder.
 */
export function MorphSheet({ origin, onMorphEnd, className, children, labelledBy }: MorphSheetProps) {
  const [isPresent, safeToRemove] = usePresence();
  const sheetRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery('(min-width: 640px)');
  const full = `inset(0px 0px 0px 0px round ${desktop ? RADIUS_DESKTOP : RADIUS_MOBILE})`;
  // Glas-Blur erst nach dem Aufziehen zuschalten – während der Animation wäre er pro Bild neu zu rechnen.
  const [settled, setSettled] = useState(false);
  const [iconAt, setIconAt] = useState<{ left: number; top: number } | null>(null);
  // Lage und Rundung zum Zeitpunkt des Öffnens – spätere Änderungen sollen den Morph nicht neu starten.
  const openingRef = useRef({ origin, full });

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const face = faceRef.current;
    if (!sheet || !face) return;
    const { origin: start, full: opened } = openingRef.current;
    const { x, y, box } = shiftToContain(sheet.getBoundingClientRect(), start);
    const from = insetOf(box, start);
    sheet.style.clipPath = from;
    sheet.style.transform = `translate(${x}px, ${y}px)`;
    setIconAt({ left: start.left - box.left + start.width / 2, top: start.top - box.top + start.height / 2 });
    const grow = animate(sheet, { clipPath: [from, opened], x: [x, 0], y: [y, 0] }, OPEN);
    const fade = animate(face, { opacity: [1, 0] }, { duration: 0.24, delay: 0.06, ease: 'easeOut' });
    void grow.then(() => {
      // Ohne Zuschnitt: Schatten und Rand des Sheets wieder vollständig.
      sheet.style.clipPath = 'none';
      sheet.style.transform = 'none';
      setSettled(true);
    });
    return () => {
      grow.stop();
      fade.stop();
    };
  }, []);

  useEffect(() => {
    if (isPresent) return;
    const sheet = sheetRef.current;
    const face = faceRef.current;
    const content = contentRef.current;
    if (!sheet || !face || !content) {
      safeToRemove();
      return;
    }
    setSettled(false);
    const { x, y, box } = shiftToContain(sheet.getBoundingClientRect(), origin);
    const to = insetOf(box, origin);
    void animate(content, { opacity: 0 }, { duration: 0.12 });
    void animate(face, { opacity: 1 }, { duration: 0.18, delay: 0.14, ease: 'easeIn' });
    void animate(sheet, { clipPath: [full, to], x: [0, x], y: [0, y] }, CLOSE).then(() => {
      onMorphEnd?.();
      safeToRemove();
    });
  }, [isPresent, safeToRemove, origin, full, onMorphEnd]);

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className={cn(className, settled && 'backdrop-blur-xl')}
    >
      <div ref={contentRef} className="morph-stagger flex min-h-0 flex-1 flex-col">
        {children}
      </div>
      {/* Knopf-Look: deckt das Sheet zu Beginn ab und blendet ins Glas über (beim Schliessen zurück). */}
      <div ref={faceRef} aria-hidden className="bg-brand-gradient pointer-events-none absolute inset-0">
        {iconAt && (
          <Plus
            // Position folgt der gemessenen Knopf-Mitte (dynamische Geometrie, wie Motion-Werte).
            style={{ left: iconAt.left, top: iconAt.top }}
            className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white"
            strokeWidth={2.5}
          />
        )}
      </div>
    </div>
  );
}
