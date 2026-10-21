import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Moon, Play, Trash2 } from 'lucide-react';
import { deleteWithUndo, togglePause } from '../../services/subscriptionActions';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { Subscription } from '../../types';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import { bounceSpring, spring } from '../../utils/motion';
import { isPausedAt } from '../../utils/pauses';
import { isActiveAt } from '../../utils/status';
import { SubscriptionCard } from './SubscriptionCard';
import { SwipeActionButton } from './SwipeActionButton';

type SwipeableSubscriptionCardProps = Omit<ComponentProps<typeof SubscriptionCard>, 'flipped' | 'onToggleFlip'>;

/** Breite der aufgedeckten Aktionen; ab der Hälfte rastet die Karte beim Loslassen ein. */
const ACTIONS_WIDTH = 140;
const SNAP_THRESHOLD = ACTIONS_WIDTH / 2;
const FLICK_VELOCITY = 500;
/** Erst in den letzten Pixeln vor dem Einrasten tauchen die Knöpfe auf. */
const REVEAL_START = -ACTIONS_WIDTH * 0.8;
/** Gummiband hinter den Knöpfen: Die Karte folgt dem Finger nur noch zu 70 %. */
const RUBBER_BAND = 0.7;
/** Ganz durchwischen löscht: mindestens so weit bzw. über die Hälfte der Kartenbreite. */
const FULL_SWIPE_MIN = ACTIONS_WIDTH + 80;
const FULL_SWIPE_SHARE = 0.55;
/** Abstand der Farbfläche zur Kartenkante (wie bei iOS). */
const FILL_GAP = 6;

const ACTION_BUTTON =
  'flex h-13 w-13 items-center justify-center rounded-full text-white shadow-lg inset-shadow-2xs inset-shadow-white/30 transition-transform focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none active:scale-90';

/**
 * iOS-Listen-Gefühl: Karte nach links wischen deckt "Pausieren" und "Löschen" auf, ganz durchwischen
 * löscht direkt (mit Rückgängig). Die Farbe füllt nur den freigewordenen Spalt – hinter der
 * durchscheinenden Glaskarte würde sie sonst durchschimmern. Beim Erreichen der Lösch-Schwelle
 * rastet die Geste spürbar ein (Vibration unter Android, sichtbarer Schnapper überall).
 * Antippen dreht die Karte um, das Zahnrad öffnet die Einstellungen – beides nicht direkt nach einem Wischer.
 */
export function SwipeableSubscriptionCard({ subscription, onSelect, ...cardProps }: SwipeableSubscriptionCardProps) {
  const openSwipeId = useDashboardStore((s) => s.openSwipeId);
  const setOpenSwipeId = useDashboardStore((s) => s.setOpenSwipeId);
  const open = openSwipeId === subscription.id;
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const pastThresholdRef = useRef(false);
  const fullSwipeRef = useRef(FULL_SWIPE_MIN);
  const armedRef = useRef(false);
  const [armed, setArmed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const paused = isPausedAt(subscription);
  // Gekündigte oder beendete Abos lassen sich nicht mehr pausieren.
  const canPause = isActiveAt(subscription) && subscription.endsOn === undefined;

  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [-ACTIONS_WIDTH, REVEAL_START], [1, 0]);
  const actionsScale = useTransform(x, [-ACTIONS_WIDTH, REVEAL_START], [1, 0.6]);
  // Farbfläche im Spalt: wächst mit dem Wischweg und wird dabei kräftiger.
  const fillWidth = useTransform(x, (value) => Math.max(0, -value - FILL_GAP));
  const fillOpacity = useTransform(x, [-ACTIONS_WIDTH * 1.6, -ACTIONS_WIDTH * 0.4, 0], [1, 0.45, 0]);

  const settle = (target: number) => animate(x, target, spring);

  // Öffnet eine andere Karte (oder wird diese geschlossen), federt die Karte in ihre Lage.
  useEffect(() => {
    const controls = animate(x, open ? -ACTIONS_WIDTH : 0, spring);
    return () => controls.stop();
  }, [open, x]);

  // Tippen irgendwo ausserhalb schliesst die offene Karte.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenSwipeId(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, setOpenSwipeId]);

  const handleDragStart = () => {
    draggedRef.current = true;
    pastThresholdRef.current = open;
    const width = containerRef.current?.offsetWidth ?? 0;
    fullSwipeRef.current = Math.max(FULL_SWIPE_MIN, width * FULL_SWIPE_SHARE);
  };

  const handleDrag = () => {
    const value = x.get();
    const past = value < -SNAP_THRESHOLD;
    if (past !== pastThresholdRef.current) {
      pastThresholdRef.current = past;
      if (past) triggerHaptic(8);
    }
    const nowArmed = value < -fullSwipeRef.current;
    if (nowArmed !== armedRef.current) {
      armedRef.current = nowArmed;
      setArmed(nowArmed);
      // Deutlich spürbarer als das Einrasten der Knöpfe: Loslassen löscht jetzt.
      if (nowArmed) triggerHaptic(20);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Der Klick nach dem Loslassen soll die Karte nicht umdrehen.
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);

    // Auch die Endlage prüfen: Bei sehr schnellen Wischern kommt das letzte onDrag erst nach dem Loslassen.
    if (armedRef.current || x.get() < -fullSwipeRef.current) {
      setOpenSwipeId(null);
      const width = containerRef.current?.offsetWidth ?? 400;
      // Karte gleitet ganz hinaus, danach klappt der Platz in der Liste zusammen.
      void animate(x, -width - 24, { type: 'spring', stiffness: 420, damping: 40 }).then(() => {
        void deleteWithUndo(subscription);
      });
      return;
    }

    const shouldOpen =
      info.velocity.x < -FLICK_VELOCITY || (info.velocity.x <= FLICK_VELOCITY && x.get() < -SNAP_THRESHOLD);
    if (shouldOpen) setOpenSwipeId(subscription.id);
    else if (open) setOpenSwipeId(null);
    // Auch ohne Zustandswechsel zurück in die Ruhelage federn.
    settle(shouldOpen ? -ACTIONS_WIDTH : 0);
  };

  /** Antippen nach einem Wischer ignorieren; ist die Karte offen, schliesst Tippen sie nur. */
  const guard = (action: () => void) => () => {
    if (draggedRef.current) return;
    if (open) {
      setOpenSwipeId(null);
      return;
    }
    action();
  };

  const runAction = (action: (sub: Subscription) => Promise<void>) => {
    setOpenSwipeId(null);
    void action(subscription);
  };

  return (
    <div ref={containerRef} data-no-tab-swipe className="relative h-full">
      {/* Farbfläche im Spalt zwischen Karte und Rand; beim Einrasten voll rot mit Papierkorb. */}
      <motion.div
        aria-hidden
        style={{ width: fillWidth, opacity: fillOpacity }}
        className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end overflow-hidden rounded-3xl pr-6 transition-colors duration-200',
          armed ? 'bg-rose-500' : 'bg-rose-500/20 dark:bg-rose-500/25',
        )}
      >
        <motion.span
          initial={false}
          animate={armed ? { scale: 1.15, opacity: 1 } : { scale: 0.6, opacity: 0 }}
          transition={bounceSpring}
          className="text-white"
        >
          <Trash2 className="h-6 w-6" aria-hidden />
        </motion.span>
      </motion.div>

      {/* Motion-Werte statt Klassen: Deckkraft und Grösse folgen der Karte Pixel für Pixel. */}
      <motion.div
        aria-hidden={!open}
        style={{ opacity: actionsOpacity, scale: actionsScale }}
        className={cn(
          'absolute inset-y-0 right-0 flex origin-right items-center justify-end gap-3 pr-2 transition-[visibility]',
          armed && 'invisible',
        )}
      >
        {canPause && (
          <div className="flex flex-col items-center gap-1">
            <SwipeActionButton
              tabIndex={open ? 0 : -1}
              onActivate={() => runAction(togglePause)}
              label={paused ? `${subscription.name} fortsetzen` : `${subscription.name} pausieren`}
              className={cn(ACTION_BUTTON, paused ? 'bg-sky-500' : 'bg-amber-500')}
            >
              {paused ? <Play className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
            </SwipeActionButton>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {paused ? 'Fortsetzen' : 'Pausieren'}
            </span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          <SwipeActionButton
            tabIndex={open ? 0 : -1}
            onActivate={() => runAction(deleteWithUndo)}
            label={`${subscription.name} löschen`}
            className={cn(ACTION_BUTTON, 'bg-rose-500')}
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </SwipeActionButton>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Löschen</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTIONS_WIDTH, right: 0 }}
        dragElastic={{ left: RUBBER_BAND, right: 0 }}
        dragMomentum={false}
        style={{ x }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative h-full touch-pan-y"
      >
        <SubscriptionCard
          subscription={subscription}
          flipped={flipped}
          onToggleFlip={guard(() => setFlipped((value) => !value))}
          onSelect={onSelect ? (sub) => guard(() => onSelect(sub))() : undefined}
          {...cardProps}
        />
      </motion.div>
    </div>
  );
}
