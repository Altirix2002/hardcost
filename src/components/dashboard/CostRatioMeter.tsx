import { motion } from 'framer-motion';
import type { CostRatio, CostRatioLevel, CostRatioThresholds } from '../../types';
import { cn } from '../../utils/cn';
import { formatPercent } from '../../utils/format';
import { spring } from '../../utils/motion';

interface CostRatioMeterProps {
  ratio: CostRatio;
  thresholds: CostRatioThresholds;
}

const LIGHT: Record<CostRatioLevel, string> = {
  green: 'bg-emerald-500 shadow-emerald-500/60',
  yellow: 'bg-yellow-400 shadow-yellow-400/60',
  red: 'bg-rose-500 shadow-rose-500/60',
};

const TEXT: Record<CostRatioLevel, string> = {
  green: 'text-emerald-700 dark:text-emerald-400',
  yellow: 'text-yellow-700 dark:text-yellow-300',
  red: 'text-rose-600 dark:text-rose-400',
};

/**
 * Fixkosten-Quote als Ampel: Skala bis zum Doppelten der Gelb-Grenze, die drei Zonen eingefärbt,
 * ein Marker zeigt die aktuelle Quote. Zonenbreiten sind feste Anteile – keine Inline-Styles nötig
 * ausser der Marker-Position (Motion-Wert).
 */
export function CostRatioMeter({ ratio, thresholds }: CostRatioMeterProps) {
  const scale = thresholds.yellow * 2;
  const position = Math.min(ratio.ratio / scale, 1);
  const greenWidth = thresholds.green / scale;
  const yellowWidth = (thresholds.yellow - thresholds.green) / scale;

  return (
    <div className="mt-4">
      <div className="relative h-2 rounded-full">
        <div className="flex h-full overflow-hidden rounded-full opacity-35">
          <motion.div
            className="h-full bg-emerald-500"
            initial={false}
            animate={{ width: `${greenWidth * 100}%` }}
            transition={spring}
          />
          <motion.div
            className="h-full bg-yellow-400"
            initial={false}
            animate={{ width: `${yellowWidth * 100}%` }}
            transition={spring}
          />
          <div className="h-full flex-1 bg-rose-500" />
        </div>
        <motion.span
          aria-hidden
          initial={{ left: '0%' }}
          animate={{ left: `${position * 100}%` }}
          transition={spring}
          className={cn(
            'absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md ring-2 ring-white transition-colors duration-500 dark:ring-zinc-900',
            LIGHT[ratio.level],
          )}
        />
      </div>
      <p className={cn('mt-1.5 flex justify-between gap-2 text-xs font-medium tabular-nums', TEXT[ratio.level])}>
        <span>{formatPercent(ratio.ratio, 1)} vom Nettoeinkommen</span>
        <span className="text-zinc-500 max-sm:hidden dark:text-zinc-400">
          Grün bis {formatPercent(thresholds.green)} · Gelb bis {formatPercent(thresholds.yellow)}
        </span>
      </p>
    </div>
  );
}
