import type { LogoShape } from '../types';

// Prozentwerte statt rounded-full, damit der Wechsel rund ⇄ Squircle weich morpht.
export const LOGO_SHAPE_CLASSES: Record<LogoShape, string> = {
  circle: 'rounded-[50%]',
  squircle: 'rounded-[30%]',
};
