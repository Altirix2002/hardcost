import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { motion, useAnimationControls, type PanInfo } from 'framer-motion';
import { Moon, Play, Trash2 } from 'lucide-react';
import { deleteWithUndo, togglePause } from '../../services/subscriptionActions';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { Subscription } from '../../types';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import { spring } from '../../utils/motion';
import { isPausedAt } from '../../utils/pauses';
import { SubscriptionCard } from './SubscriptionCard';

type SwipeableSubscriptionCardProps = ComponentProps<typeof SubscriptionCard>;

/** Breite der aufgedeckten Aktionen; ab der Hälfte rastet die Karte beim Loslassen ein. */
const ACTIONS_WIDTH = 140;
const SNAP_THRESHOLD = ACTIONS_WIDTH / 2;
const FLICK_VELOCITY = 500;

const ACTION_BUTTON =
  'flex h-13 w-13 items-center justify-center rounded-full text-white shadow-lg inset-shadow-2xs inset-shadow-white/30 transition-transform focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none active:scale-90';

/**
 * iOS-Listen-Gefühl: Karte nach links wischen deckt "Pausieren" und "Löschen" auf.
 * Beim Überschreiten der Einrastschwelle gibt es einen kurzen Vibrationsimpuls.
 */
export function SwipeableSubscriptionCard({ subscription, onSelect, ...cardProps }: SwipeableSubscriptionCardProps) {
  const openSwipeId = useDashboardStore((s) => s.openSwipeId);
  const setOpenSwipeId = useDashboardStore((s) => s.setOpenSwipeId);
  const open = openSwipeId === subscription.id;
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const pastThresholdRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const paused = isPausedAt(subscription);

  // Öffnet eine andere Karte (oder wird diese geschlossen), federt die Karte in ihre Lage.
  useEffect(() => {
    void controls.start({ x: open ? -ACTIONS_WIDTH : 0, transition: spring });
  }, [open, controls]);

  // Tippen irgendwo ausserhalb schliesst die offene Karte.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenSwipeId(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, setOpenSwipeId]);

  const offsetFor = (info: PanInfo) => (open ? -ACTIONS_WIDTH : 0) + info.offset.x;

  const handleDrag = (_: unknown, info: PanInfo) => {
    const past = offsetFor(info) < -SNAP_THRESHOLD;
    if (past !== pastThresholdRef.current) {
      pastThresholdRef.current = past;
      if (past) triggerHaptic(8);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const shouldOpen =
      info.velocity.x < -FLICK_VELOCITY || (info.velocity.x <= FLICK_VELOCITY && offsetFor(info) < -SNAP_THRESHOLD);
    setOpenSwipeId(shouldOpen ? subscription.id : open ? null : openSwipeId);
    // Auch ohne Zustandswechsel zurück in die Ruhelage federn.
    void controls.start({ x: shouldOpen ? -ACTIONS_WIDTH : 0, transition: spring });
    setDragging(false);
    // Der Klick nach dem Loslassen soll nicht das Formular öffnen.
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleSelect = (sub: Subscription) => {
    if (draggedRef.current) return;
    if (open) {
      setOpenSwipeId(null);
      return;
    }
    onSelect?.(sub);
  };

  const runAction = (action: (sub: Subscription) => Promise<void>) => {
    setOpenSwipeId(null);
    void action(subscription);
  };

  return (
    <div ref={containerRef} className="relative h-full">
      <motion.div
        aria-hidden={!open}
        initial={false}
        animate={{ opacity: open || dragging ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-y-0 right-0 flex items-center justify-end gap-3 pr-2"
      >
        {subscription.isActive && (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => runAction(togglePause)}
              aria-label={paused ? `${subscription.name} fortsetzen` : `${subscription.name} pausieren`}
              className={cn(ACTION_BUTTON, paused ? 'bg-sky-500' : 'bg-amber-500')}
            >
              {paused ? <Play className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
            </button>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {paused ? 'Fortsetzen' : 'Pausieren'}
            </span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => runAction(deleteWithUndo)}
            aria-label={`${subscription.name} löschen`}
            className={cn(ACTION_BUTTON, 'bg-rose-500')}
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </button>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Löschen</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTIONS_WIDTH, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        dragMomentum={false}
        animate={controls}
        onDragStart={() => {
          draggedRef.current = true;
          pastThresholdRef.current = open;
          setDragging(true);
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative h-full touch-pan-y"
      >
        <SubscriptionCard subscription={subscription} onSelect={handleSelect} {...cardProps} />
      </motion.div>
    </div>
  );
}
