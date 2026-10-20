import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { ChartLine, Table2 } from 'lucide-react';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { MonthlySpendPoint } from '../../types';
import { clamp, getNiceTicks } from '../../utils/chart';
import { formatCompactNumber, formatCurrency, formatMonthYear, formatShortMonth } from '../../utils/format';
import { Button } from '../ui/Button';

interface SpendChartProps {
  points: MonthlySpendPoint[];
  currency: string;
  /** Ohne Auswahl hervorgehobener Monat (Standard: der letzte, z.B. bei der Prognose der erste). */
  defaultIndex?: number;
}

const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

/** Einreihiges Liniendiagramm der Monatsausgaben mit Fadenkreuz, Tastatursteuerung und Tabellenansicht. */
export function SpendChart({ points, currency, defaultIndex }: SpendChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const lastIndex = points.length - 1;
  const ticks = getNiceTicks(Math.max(0, ...points.map((p) => p.total)));
  const yMax = ticks[ticks.length - 1] || 1;
  const innerWidth = Math.max(0, width - PAD.left - PAD.right);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (index: number) => PAD.left + (lastIndex > 0 ? (index / lastIndex) * innerWidth : innerWidth / 2);
  const y = (value: number) => PAD.top + innerHeight - (value / yMax) * innerHeight;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.total)}`).join(' ');
  const areaPath = `${linePath} L${x(lastIndex)},${y(0)} L${x(0)},${y(0)} Z`;
  // Schmale Diagramme beschriften nur jeden zweiten Monat – der aktuelle ist immer dabei.
  const labelEvery = innerWidth < 360 ? 2 : 1;

  const restingIndex = defaultIndex ?? lastIndex;
  const shownIndex = activeIndex ?? restingIndex;
  const shown = points[shownIndex];

  const pickFromPointer = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    setActiveIndex(clamp(Math.round(ratio * lastIndex), 0, lastIndex));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    setActiveIndex((current) => clamp((current ?? restingIndex) + step, 0, lastIndex));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div aria-live="polite">
          {shown && (
            <>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatMonthYear(shown.year, shown.month)}</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCurrency(shown.total, currency)}</p>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={showTable ? ChartLine : Table2}
          aria-pressed={showTable}
          onClick={() => setShowTable((value) => !value)}
        >
          {showTable ? 'Diagramm' : 'Tabelle'}
        </Button>
      </div>

      {/* Der Container bleibt immer gemountet, damit die Breitenmessung nach dem Umschalten stimmt. */}
      <div ref={containerRef} className="w-full">
      {showTable ? (
        <table className="w-full text-sm">
          <caption className="sr-only">Ausgaben pro Monat</caption>
          <thead>
            <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
              <th scope="col" className="pb-2 font-medium">Monat</th>
              <th scope="col" className="pb-2 text-right font-medium">Ausgaben</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((point) => (
              <tr key={`${point.year}-${point.month}`} className="border-t border-zinc-900/5 dark:border-white/10">
                <td className="py-2">{formatMonthYear(point.year, point.month)}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(point.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          {width > 0 && (
            <svg
              width={width}
              height={HEIGHT}
              role="group"
              aria-label="Ausgabenverlauf der letzten 12 Monate. Mit den Pfeiltasten Monate wählen."
              tabIndex={0}
              onKeyDown={onKeyDown}
              onBlur={() => setActiveIndex(null)}
              className="overflow-visible rounded-xl focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none"
            >
              {ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + innerWidth}
                    y1={y(tick)}
                    y2={y(tick)}
                    strokeWidth={1}
                    className="stroke-zinc-900/10 dark:stroke-white/10"
                  />
                  <text
                    x={PAD.left - 8}
                    y={y(tick)}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-zinc-500 text-[10px] tabular-nums dark:fill-zinc-400"
                  >
                    {formatCompactNumber(tick)}
                  </text>
                </g>
              ))}

              {points.map((point, index) =>
                (lastIndex - index) % labelEvery === 0 ? (
                  <text
                    key={`${point.year}-${point.month}`}
                    x={x(index)}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className={
                      index === shownIndex
                        ? 'fill-zinc-900 text-[10px] font-medium dark:fill-zinc-100'
                        : 'fill-zinc-500 text-[10px] dark:fill-zinc-400'
                    }
                  >
                    {formatShortMonth(point.year, point.month)}
                  </text>
                ) : null,
              )}

              <motion.path
                d={areaPath}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="fill-sky-500/10 dark:fill-sky-400/10"
              />
              <motion.path
                d={linePath}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="stroke-sky-500 dark:stroke-sky-400"
              />

              {activeIndex !== null && (
                <line
                  x1={x(activeIndex)}
                  x2={x(activeIndex)}
                  y1={PAD.top}
                  y2={y(0)}
                  strokeWidth={1}
                  className="stroke-zinc-400/60 dark:stroke-zinc-500/60"
                />
              )}
              {shown && (
                <circle
                  cx={x(shownIndex)}
                  cy={y(shown.total)}
                  r={5}
                  strokeWidth={2}
                  className="fill-sky-500 stroke-white dark:fill-sky-400 dark:stroke-zinc-900"
                />
              )}

              {/* Trefferfläche über die ganze Plotbreite, grösser als die Markierungen. */}
              <rect
                x={PAD.left - 8}
                y={PAD.top}
                width={innerWidth + 16}
                height={innerHeight}
                fill="transparent"
                data-no-tab-swipe
                className="cursor-crosshair touch-pan-y"
                onPointerMove={pickFromPointer}
                onPointerDown={pickFromPointer}
                onPointerLeave={() => setActiveIndex(null)}
              />
            </svg>
          )}
        </>
      )}
      </div>
    </div>
  );
}
