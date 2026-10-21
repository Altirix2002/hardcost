import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, type AnimationPlaybackControls, type MotionValue } from 'framer-motion';

export type CardFace = 'front' | 'back';

/** Erste Hälfte zügig bis zur Kante, zweite federnd zurück – wirkt wie eine durchgehende Drehung. */
const HALF_TURN = { duration: 0.16, ease: [0.4, 0, 1, 1] } as const;
const SETTLE = { type: 'spring', stiffness: 260, damping: 22 } as const;

/**
 * Horizontale 180°-Drehung ohne \`preserve-3d\`: Die Karte dreht bis 90° (Kante zum Betrachter),
 * tauscht dort den Inhalt und dreht von −90° zurück auf 0°. Optisch eine volle Drehung, aber jede
 * Seite bleibt ein flaches Element – so bleiben Glas-Blur und Schatten in Chrome erhalten.
 */
export function useCardFlip(flipped: boolean): { rotateY: MotionValue<number>; face: CardFace } {
  const rotateY = useMotionValue(0);
  const [face, setFace] = useState<CardFace>(flipped ? 'back' : 'front');
  const faceRef = useRef(face);

  useEffect(() => {
    const target: CardFace = flipped ? 'back' : 'front';
    if (faceRef.current === target) {
      // Schnell zurückgetippt: aus der aktuellen Lage in die Ruhe federn.
      const controls = animate(rotateY, 0, SETTLE);
      return () => controls.stop();
    }
    const swap = () => {
      faceRef.current = target;
      setFace(target);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      swap();
      return;
    }

    const direction = target === 'back' ? 1 : -1;
    let settle: AnimationPlaybackControls | undefined;
    let cancelled = false;
    const half = animate(rotateY, 90 * direction, HALF_TURN);
    void half.then(() => {
      if (cancelled) return;
      swap();
      rotateY.set(-90 * direction);
      settle = animate(rotateY, 0, SETTLE);
    });
    return () => {
      cancelled = true;
      half.stop();
      settle?.stop();
    };
  }, [flipped, rotateY]);

  return { rotateY, face };
}
