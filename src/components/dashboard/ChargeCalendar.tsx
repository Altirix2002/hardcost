import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category, ExchangeRates, Subscription, UpcomingCharge } from '../../types';
import { getChargesBetween } from '../../utils/calculations';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { parseISODate, toISODate } from '../../utils/dates';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { formatCurrency, formatMonthYear, formatWeekdayDate } from '../../utils/format';
import { springWithFade } from '../../utils/motion';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';
import { IconButton } from '../ui/IconButton';

interface ChargeCalendarProps {
  subscriptions: Subscription[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect: (subscription: Subscription) => void;
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MAX_DOTS = 3;

/** Monatsraster der Abbuchungen – vergangene mit dem damaligen Preis, künftige als Vorschau. */
export function ChargeCalendar({ subscriptions, categoriesById, baseCurrency, rates, onSelect }: ChargeCalendarProps) {
  const today = new Date();
  const todayIso = toISODate(today);
  const [[year, month, direction], setMonth] = useState<[number, number, number]>([
    today.getFullYear(),
    today.getMonth(),
    0,
  ]);
  const [selected, setSelected] = useState<string>(todayIso);

  const { byDay, total, count } = useMemo(() => {
    const charges = getChargesBetween(
      subscriptions,
      new Date(year, month, 1),
      new Date(year, month + 1, 0),
      baseCurrency,
      rates,
    );
    const grouped = new Map<string, UpcomingCharge[]>();
    for (const charge of charges) {
      const key = toISODate(charge.date);
      grouped.set(key, [...(grouped.get(key) ?? []), charge]);
    }
    return { byDay: grouped, total: charges.reduce((sum, c) => sum + c.amount, 0), count: charges.length };
  }, [subscriptions, year, month, baseCurrency, rates]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7; // Montag zuerst
  const selectedCharges = byDay.get(selected) ?? [];

  const shift = (step: number) => {
    const date = new Date(year, month + step, 1);
    setMonth([date.getFullYear(), date.getMonth(), step]);
    // Heute vorwählen, sonst den 1. des Monats.
    const isCurrent = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    setSelected(isCurrent ? todayIso : toISODate(date));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <IconButton icon={ChevronLeft} label="Vorheriger Monat" onClick={() => shift(-1)} />
        <div className="text-center">
          <p className="font-semibold tracking-tight">{formatMonthYear(year, month)}</p>
          <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            {formatCurrency(total, baseCurrency)} · {count === 1 ? '1 Abbuchung' : `${count} Abbuchungen`}
          </p>
        </div>
        <IconButton icon={ChevronRight} label="Nächster Monat" onClick={() => shift(1)} />
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={springWithFade}
            className="grid grid-cols-7 gap-1"
          >
            {WEEKDAYS.map((day) => (
              <span key={day} className="pb-1 text-center text-xs font-medium text-zinc-400">
                {day}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const iso = toISODate(new Date(year, month, day));
              const charges = byDay.get(iso) ?? [];
              const isSelected = iso === selected;
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  aria-pressed={isSelected}
                  aria-label={`${day}. ${formatMonthYear(year, month)}${charges.length ? `, ${charges.length} Abbuchungen` : ''}`}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm tabular-nums transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none',
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'hover:bg-zinc-900/5 dark:hover:bg-white/10',
                    !isSelected && isToday && 'ring-1 ring-sky-500/60',
                    iso < todayIso && !isSelected && 'text-zinc-400 dark:text-zinc-500',
                  )}
                >
                  <span className={cn(charges.length > 0 && 'font-semibold')}>{day}</span>
                  <span className="flex h-1.5 gap-0.5">
                    {charges.slice(0, MAX_DOTS).map((charge) => (
                      <span
                        key={charge.subscription.id}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          getCategoryColorClasses(categoriesById.get(charge.subscription.categoryId)?.color ?? 'slate').solid,
                        )}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={cn(INSET_PANEL, 'flex flex-col gap-2')}>
        <p className="text-sm font-medium">{formatWeekdayDate(parseISODate(selected))}</p>
        {selectedCharges.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Keine Abbuchung an diesem Tag.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {selectedCharges.map(({ subscription, amount, originalAmount, currency }) => (
              <li key={subscription.id}>
                <button
                  type="button"
                  onClick={() => onSelect(subscription)}
                  className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-zinc-900/5 dark:hover:bg-white/10"
                >
                  <SubscriptionLogo
                    name={subscription.name}
                    logoUrl={subscription.logoUrl}
                    shape={subscription.logoShape}
                    color={categoriesById.get(subscription.categoryId)?.color}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{subscription.name}</span>
                  <span className="shrink-0 text-right text-sm tabular-nums">
                    <span className="block font-semibold">{formatCurrency(amount, baseCurrency)}</span>
                    {currency !== baseCurrency && (
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {formatCurrency(originalAmount, currency)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
