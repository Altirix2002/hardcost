import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { CategoryColor } from '../../types';
import { CATEGORY_COLOR_CLASSES } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';

interface BadgeProps {
  color: CategoryColor;
  icon?: LucideIcon;
  children: ReactNode;
}

export function Badge({ color, icon: Icon, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        CATEGORY_COLOR_CLASSES[color].soft,
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}
