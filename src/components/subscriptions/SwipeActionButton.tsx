import { useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface SwipeActionButtonProps {
  label: string;
  onActivate: () => void;
  tabIndex: number;
  className?: string;
  children: ReactNode;
}

/** So weit darf sich der Finger zwischen Drücken und Loslassen bewegen, damit es als Tipp zählt. */
const TAP_SLOP = 12;

/**
 * Knopf hinter einer weggewischten Karte. Löst schon beim Loslassen des Fingers aus statt erst beim
 * Klick: Ein Wischer ist nie ganz waagrecht, Chrome scrollt dabei oft minimal mit Nachlauf – ein Tipp
 * in dieser Phase stoppt nur das Scrollen und erzeugt keinen Klick. Pointer-Events kommen trotzdem an.
 * Der Klick bleibt für die Tastatur (Enter/Leertaste) erhalten, doppeltes Auslösen ist ausgeschlossen.
 */
export function SwipeActionButton({ label, onActivate, tabIndex, className, children }: SwipeActionButtonProps) {
  const pressRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press || press.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP) return;
    firedRef.current = true;
    window.setTimeout(() => {
      firedRef.current = false;
    }, 600);
    onActivate();
  };

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      aria-label={label}
      onPointerDown={(event) => {
        pressRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pressRef.current = null;
      }}
      onClick={() => {
        if (!firedRef.current) onActivate();
      }}
      className={cn('touch-manipulation', className)}
    >
      {children}
    </button>
  );
}
