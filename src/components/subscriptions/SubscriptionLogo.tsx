import { useState } from 'react';
import type { CategoryColor, LogoShape } from '../../types';
import { CATEGORY_COLOR_CLASSES } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';

interface SubscriptionLogoProps {
  name: string;
  logoUrl?: string;
  shape: LogoShape;
  /** Hintergrundfarbe für das Initialen-Fallback. */
  color?: CategoryColor;
  size?: 'sm' | 'md' | 'lg';
}

// Prozentwerte statt rounded-full, damit der Wechsel rund ⇄ Squircle weich morpht.
const SHAPE_CLASSES: Record<LogoShape, string> = {
  circle: 'rounded-[50%]',
  squircle: 'rounded-[30%]',
};

const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
} as const;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const initials = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : name.slice(0, 2);
  return initials.toUpperCase();
}

export function SubscriptionLogo({ name, logoUrl, shape, color = 'slate', size = 'md' }: SubscriptionLogoProps) {
  const [failed, setFailed] = useState(false);
  const base = cn(
    'shrink-0 overflow-hidden ring-1 ring-black/5 transition-[border-radius] duration-500 ease-out dark:ring-white/10',
    SHAPE_CLASSES[shape],
    SIZE_CLASSES[size],
  );

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(base, 'bg-white object-cover')}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(base, 'flex items-center justify-center font-semibold text-white', CATEGORY_COLOR_CLASSES[color].solid)}
    >
      {getInitials(name)}
    </div>
  );
}
