import { useEffect, useState } from 'react';
import { animate, useMotionValue, type MotionValue } from 'framer-motion';

export type CardFace = 'front' | 'back';

/** Eine ruhige Drehung ohne Überschwingen – kein Nachfedern, das wie eine zweite Drehung wirkt. */
const TURN = { duration: 0.55, ease: [0.45, 0, 0.2, 1] } as const;

/**
 * Horizontale Drehung um genau 180° (zurück ebenso um 180°). Ohne `preserve-3d`: Die Karte bleibt
 * ein flaches Element – so bleiben Glas-Blur und Schatten in Chrome erhalten. Ab 90° zeigt sie die
 * Rückseite; diese ist gespiegelt gezeichnet (CardFaces) und erscheint dadurch lesbar.
 */
export function useCardFlip(flipped: boolean): { rotateY: MotionValue<number>; face: CardFace } {
  const rotateY = useMotionValue(flipped ? 180 : 0);
  const [face, setFace] = useState<CardFace>(flipped ? 'back' : 'front');

  useEffect(
    () =>
      rotateY.on('change', (angle) => {
        const next: CardFace = angle > 90 ? 'back' : 'front';
        setFace((current) => (current === next ? current : next));
      }),
    [rotateY],
  );

  useEffect(() => {
    const target = flipped ? 180 : 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rotateY.set(target);
      return;
    }
    // Aus der aktuellen Lage weiter – ein zweiter Tipp mitten in der Drehung kehrt sie einfach um.
    const controls = animate(rotateY, target, TURN);
    return () => controls.stop();
  }, [flipped, rotateY]);

  return { rotateY, face };
}
