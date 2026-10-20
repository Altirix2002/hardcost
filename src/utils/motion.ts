import type { Transition, Variants } from 'framer-motion';

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

/** Sanftere Feder für weite Layout-Verschiebungen (z.B. nachrutschende Karten). */
export const softSpring: Transition = { type: 'spring', stiffness: 220, damping: 24, mass: 1 };

/** Kurzer Micro-Bounce für Icons, Badges und Toasts. */
export const bounceSpring: Transition = { type: 'spring', stiffness: 500, damping: 18 };

/**
 * Kritisch gedämpft (schwingt nicht unter 0) und bewusst sanft: Klappen viele Einträge zugleich
 * auf oder zu (z.B. beim Filtern), addieren sich ihre Höhen – die übrigen Karten sollen gleiten, nicht springen.
 */
const collapse: Transition = { type: 'spring', stiffness: 210, damping: 30, mass: 1 };

/** Versatz zwischen gleichzeitig erscheinenden Einträgen. */
const STAGGER = 0.06;

function makeCollapseVariants(baseDelay: number): Variants {
  return {
    hidden: { opacity: 0, height: 0, scale: 0.96, overflow: 'hidden' },
    visible: (index: number = 0) => {
      const delay = baseDelay + Math.min(index, 8) * STAGGER;
      return {
        opacity: 1,
        height: 'auto',
        scale: 1,
        overflow: 'hidden',
        transitionEnd: { overflow: 'visible' },
        transition: {
          height: { ...collapse, delay },
          scale: { ...spring, delay },
          opacity: { duration: 0.25, ease: 'easeOut', delay },
        },
      };
    },
    exit: {
      opacity: 0,
      height: 0,
      scale: 0.96,
      overflow: 'hidden',
      transition: {
        height: { ...collapse, delay: baseDelay },
        scale: { ...spring, delay: baseDelay },
        opacity: { duration: 0.18, ease: 'easeOut', delay: baseDelay },
      },
    },
  };
}

/**
 * Listeneinträge klappen beim Verschwinden auf Höhe 0 zusammen (und beim Erscheinen auf), statt aus
 * dem Fluss zu springen. So schrumpft die Seite Pixel für Pixel und die übrigen Einträge gleiten nach –
 * auch ganz unten, wo der Browser sonst die Scroll-Position ruckartig korrigieren müsste.
 * Wichtig: Abstände als Innenabstand eines inneren Elements, nicht am Eintrag selbst (den würde
 * Framer beim Zusammenklappen herausrechnen). Überlauf ist nur während der Animation abgeschnitten.
 * `custom` = Index für eine leichte Staffelung beim Erscheinen.
 */
export const collapseItemVariants = makeCollapseVariants(0);

/**
 * Wie collapseItemVariants, aber leicht verzögert – für grosse Wechsel (Leer-Ansicht ↔ ganze Liste).
 * Das Einhängen vieler Karten macht das erste Bild langsam; ohne Verzögerung holt die Feder die
 * verlorene Zeit in einem sichtbaren Sprung auf.
 */
export const swapVariants = makeCollapseVariants(0.06);
