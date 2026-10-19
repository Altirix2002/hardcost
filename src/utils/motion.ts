import type { Transition } from 'framer-motion';

/** Weiche Apple-Style-Feder für Hover, Taps und Layout-Morphs. */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 };

/** Etwas trägere Feder für grössere Flächen (Sheets, Modals). */
export const sheetSpring: Transition = { type: 'spring', stiffness: 300, damping: 32 };
