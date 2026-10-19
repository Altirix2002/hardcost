import type { Transition } from 'framer-motion';

/** Weiche Apple-Style-Feder für Hover, Taps und Layout-Morphs. */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 };

/** Etwas trägere Feder für grössere Flächen (Sheets, Modals). */
export const sheetSpring: Transition = { type: 'spring', stiffness: 300, damping: 32 };

/**
 * Deckkraft immer per kurzer Tween statt Feder animieren: Solange ein Element (oder ein Vorfahre)
 * weniger als 100 % deckt, schaltet Chrome `backdrop-filter` darin ab. Eine Feder schwingt lange
 * knapp unter 1 aus – Glasflächen wirken dann sekundenlang durchsichtig statt verschwommen.
 */
const fade: Transition = { duration: 0.2, ease: 'easeOut' };

export const springWithFade: Transition = { ...spring, opacity: fade };

export const sheetSpringWithFade: Transition = { ...sheetSpring, opacity: fade };
