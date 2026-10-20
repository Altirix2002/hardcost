import { useState } from 'react';
import type { CategoryColor, LogoShape } from '../../types';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { LOGO_SHAPE_CLASSES } from '../../utils/logoStyles';

interface SubscriptionLogoProps {
  name: string;
  logoUrl?: string;
  shape: LogoShape;
  /** Hintergrundfarbe für das Initialen-Fallback. */
  color?: CategoryColor;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
} as const;

function getInitials(name: string): string {
  // Nur Buchstaben/Ziffern zählen – sonst wird aus "Netflix (Kopie)" das Kürzel "N(".
  const words = name.match(/[\p{L}\p{N}][\p{L}\p{N}+]*/gu) ?? [name.trim()];
  const initials = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : (words[0] ?? '').slice(0, 2);
  return initials.toUpperCase();
}

export function SubscriptionLogo({ name, logoUrl, shape, color = 'slate', size = 'md' }: SubscriptionLogoProps) {
  const [failed, setFailed] = useState(false);
  const colorClasses = getCategoryColorClasses(color);
  const base = cn(
    'shrink-0 overflow-hidden ring-1 ring-black/5 transition-[border-radius] duration-500 ease-out dark:ring-white/10',
    LOGO_SHAPE_CLASSES[shape],
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
      className={cn(base, 'flex items-center justify-center font-semibold', colorClasses.solid, colorClasses.onSolid)}
    >
      {getInitials(name)}
    </div>
  );
}
