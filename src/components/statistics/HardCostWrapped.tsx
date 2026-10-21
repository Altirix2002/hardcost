import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type PanInfo, type Variants } from 'framer-motion';
import { Crown, PiggyBank, Sparkles, TrendingUp, Wallet, X, type LucideIcon } from 'lucide-react';
import type { Category, WrappedSummary } from '../../types';
import { cn } from '../../utils/cn';
import { parseISODate } from '../../utils/dates';
import { formatCurrency, formatDate, formatPercent } from '../../utils/format';
import { sheetSpring, spring } from '../../utils/motion';
import { SubscriptionLogo } from '../subscriptions/SubscriptionLogo';
import { AnimatedCurrency } from '../ui/AnimatedCurrency';

interface HardCostWrappedProps {
  open: boolean;
  summary: WrappedSummary;
  categoriesById: Map<string, Category>;
  currency: string;
  onClose: () => void;
}

interface StoryCard {
  key: string;
  icon: LucideIcon;
  eyebrow: string;
  gradient: string;
  content: ReactNode;
}

const SLIDE: Variants = {
  enter: (direction: number) => ({ x: direction * 80, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction * -80, opacity: 0, scale: 0.96 }),
};

const SWIPE_THRESHOLD = 60;

function BigValue({ children }: { children: ReactNode }) {
  return <p className="text-5xl font-bold tracking-tight tabular-nums sm:text-6xl">{children}</p>;
}

function buildCards(summary: WrappedSummary, categoriesById: Map<string, Category>, currency: string): StoryCard[] {
  const { topSubscription: top, biggestHike: hike } = summary;
  const saved = summary.savedByPauses + summary.savedByCancellations;

  return [
    {
      key: 'intro',
      icon: Sparkles,
      eyebrow: 'HardCost Wrapped',
      gradient: 'from-sky-500 via-indigo-500 to-violet-600',
      content: (
        <>
          <p className="text-4xl font-bold tracking-tight">Dein Abo-Jahr</p>
          <p className="text-lg text-white/80">
            {formatDate(summary.periodStart, true)} – {formatDate(summary.periodEnd, true)}
          </p>
          <p className="text-white/70">Tippe rechts für weiter, links für zurück.</p>
        </>
      ),
    },
    {
      key: 'total',
      icon: Wallet,
      eyebrow: 'Die Jahressumme',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      content: (
        <>
          <p className="text-lg text-white/80">An alle Dienste überwiesen:</p>
          <BigValue>
            <AnimatedCurrency value={summary.totalSpent} currency={currency} />
          </BigValue>
          <p className="text-white/80">
            {summary.chargeCount} Abbuchungen bei {summary.subscriptionCount}{' '}
            {summary.subscriptionCount === 1 ? 'Dienst' : 'Diensten'} · ≈ {formatCurrency(summary.totalSpent / 365, currency)}{' '}
            pro Tag
          </p>
        </>
      ),
    },
    {
      key: 'top',
      icon: Crown,
      eyebrow: 'Der Spitzenreiter',
      gradient: 'from-amber-500 via-orange-500 to-rose-500',
      content: top ? (
        <>
          <div className="mb-2 origin-bottom-left scale-150 self-start">
            <SubscriptionLogo
              name={top.subscription.name}
              logoUrl={top.subscription.logoUrl}
              shape={top.subscription.logoShape}
              color={categoriesById.get(top.subscription.categoryId)?.color}
            />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight">{top.subscription.name}</p>
          <BigValue>{formatCurrency(top.total, currency)}</BigValue>
          <p className="text-white/80">
            {summary.totalSpent > 0 && `${formatPercent(top.total / summary.totalSpent)} deiner Abo-Ausgaben`}
          </p>
        </>
      ) : (
        <p className="text-3xl font-bold tracking-tight">Noch keine Abbuchungen in diesem Zeitraum.</p>
      ),
    },
    {
      key: 'hike',
      icon: TrendingUp,
      eyebrow: 'Der Preisschock',
      gradient: 'from-rose-500 via-red-500 to-orange-500',
      content: hike ? (
        <>
          <p className="text-4xl font-bold tracking-tight">{hike.subscription.name}</p>
          <BigValue>+{formatPercent(hike.percentageChange, 1)}</BigValue>
          <p className="text-white/80">
            {formatCurrency(hike.previousAmount, hike.currency)} → {formatCurrency(hike.currentAmount, hike.currency)} seit{' '}
            {formatDate(parseISODate(hike.effectiveDate), true)}
          </p>
        </>
      ) : (
        <>
          <p className="text-4xl font-bold tracking-tight">Keine Preiserhöhung</p>
          <p className="text-lg text-white/80">Kein Dienst ist im letzten Jahr teurer geworden – zumindest keiner, den du erfasst hast.</p>
        </>
      ),
    },
    {
      key: 'saved',
      icon: PiggyBank,
      eyebrow: 'Der Spar-Helfer',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      content:
        saved > 0 ? (
          <>
            <p className="text-lg text-white/80">Durch Pausen und Kündigungen vermieden:</p>
            <BigValue>
              <AnimatedCurrency value={saved} currency={currency} />
            </BigValue>
            <p className="text-white/80">
              {summary.savedByPauses > 0 && `Pausen: ${formatCurrency(summary.savedByPauses, currency)}`}
              {summary.savedByPauses > 0 && summary.savedByCancellations > 0 && ' · '}
              {summary.savedByCancellations > 0 && `Kündigungen: ${formatCurrency(summary.savedByCancellations, currency)}`}
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl font-bold tracking-tight">Sparpotenzial wartet</p>
            <p className="text-lg text-white/80">
              Noch nichts pausiert oder gekündigt. Der Spar-Simulator zeigt dir, was drin läge.
            </p>
          </>
        ),
    },
  ];
}

/** Persönlicher Jahresrückblick im Story-Format: tippen, wischen oder Pfeiltasten. */
export function HardCostWrapped({ open, summary, categoriesById, currency, onClose }: HardCostWrappedProps) {
  const cards = buildCards(summary, categoriesById, currency);
  const [[index, direction], setPage] = useState<[number, number]>([0, 1]);
  const card = cards[index] ?? cards[0];

  // Bei jedem Öffnen von vorne beginnen.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPage([0, 1]);
  }

  // Nach einem Wischer feuert der Browser beim Loslassen zusätzlich einen Klick auf die Tippzone.
  const draggedRef = useRef(false);

  const go = useCallback(
    (step: number) => {
      const next = index + step;
      if (next >= cards.length) onClose();
      else setPage([Math.max(0, next), step]);
    },
    [index, cards.length, onClose],
  );

  const tap = (step: number) => {
    if (draggedRef.current) return;
    go(step);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight' || event.key === ' ') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, go, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) go(1);
    else if (info.offset.x > SWIPE_THRESHOLD) go(-1);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  if (!card) return null;
  const Icon = card.icon;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="HardCost Wrapped – dein Abo-Jahr"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={sheetSpring}
          className="fixed inset-0 z-[70] flex items-stretch justify-center bg-zinc-950/80 backdrop-blur-xl sm:items-center sm:p-6"
        >
          <div
            className={cn(
              'relative flex w-full flex-col overflow-hidden bg-linear-to-br text-white sm:h-[min(44rem,92dvh)] sm:max-w-md sm:rounded-[2rem] sm:shadow-2xl',
              card.gradient,
            )}
          >
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />

            <div className="relative z-10 flex gap-1.5 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              {cards.map((entry, i) => (
                <span key={entry.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <motion.span
                    className="block h-full rounded-full bg-white"
                    initial={false}
                    animate={{ width: i <= index ? '100%' : '0%' }}
                    transition={spring}
                  />
                </span>
              ))}
            </div>
            <div className="relative z-10 flex items-center justify-between px-4 pt-3">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white/90 uppercase">
                <Icon className="h-4 w-4" aria-hidden />
                {card.eyebrow}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Rückblick schliessen"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <motion.div
              className="relative flex min-h-0 flex-1 touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              dragSnapToOrigin
              onDragStart={() => {
                draggedRef.current = true;
              }}
              onDragEnd={onDragEnd}
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={card.key}
                  custom={direction}
                  variants={SLIDE}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={sheetSpring}
                  className="flex w-full flex-col justify-center gap-3 px-8 pb-[max(3rem,env(safe-area-inset-bottom))]"
                >
                  {card.content}
                </motion.div>
              </AnimatePresence>
              {/* Tippzonen wie bei Stories: links zurück, rechts weiter. */}
              <button type="button" aria-label="Zurück" onClick={() => tap(-1)} className="absolute inset-y-0 left-0 w-1/3 outline-none" />
              <button type="button" aria-label="Weiter" onClick={() => tap(1)} className="absolute inset-y-0 right-0 w-2/3 outline-none" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
