import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlarmClock, CalendarX, Gift, Moon, Users, type LucideIcon } from 'lucide-react';
import type { Category, ExchangeRates, Subscription } from '../../types';
import {
  getCancellationAlert,
  getCurrentInterval,
  getMonthlyCost,
  getRegularMonthlyCost,
} from '../../utils/calculations';
import { useCardFlip } from '../../hooks/useCardFlip';
import { useSettingsStore } from '../../store/useSettingsStore';
import { brandColorStyle } from '../../utils/brandColors';
import { getSubscriptionFacts } from '../../utils/cardFacts';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { isPausedAt } from '../../utils/pauses';
import { isActiveAt, isInTrialAt, isRunningOut } from '../../utils/status';
import { GlassCard } from '../ui/GlassCard';
import { CardAura } from './CardAura';
import { CardFaces } from './CardFaces';
import { CardSettingsButton } from './CardSettingsButton';
import { SubscriptionLogo } from './SubscriptionLogo';
import { SubscriptionTileBack } from './SubscriptionTileBack';

interface SubscriptionTileProps {
  subscription: Subscription;
  category?: Category;
  baseCurrency: string;
  rates: ExchangeRates | null;
  /** Zahnrad oben links: öffnet die Abo-Einstellungen. */
  onSelect?: (subscription: Subscription) => void;
  /** Aus im Anordnen-Modus: Antippen dreht dann nicht. */
  flippable?: boolean;
}

interface TileStatus {
  icon: LucideIcon;
  label: string;
  className: string;
}

/** Wichtigster Zustand als kleines Symbol oben rechts – Details zeigt die Listen-Ansicht. */
function getTileStatus(sub: Subscription, today: Date): TileStatus | null {
  if (getCancellationAlert(sub, today)) {
    return {
      icon: AlarmClock,
      label: 'Kündigungsfrist läuft bald ab',
      className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    };
  }
  if (isActiveAt(sub, today) && isInTrialAt(sub, today)) {
    return { icon: Gift, label: 'In der Gratis-Testphase', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' };
  }
  if (isActiveAt(sub, today) && isPausedAt(sub, today)) {
    return { icon: Moon, label: 'Pausiert', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
  }
  if (isRunningOut(sub, today) || !isActiveAt(sub, today)) {
    return { icon: CalendarX, label: 'Gekündigt', className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' };
  }
  if (sub.split) {
    return {
      icon: Users,
      label: 'Geteilt – nur dein Anteil zählt',
      className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    };
  }
  return null;
}

/** Kompakte Kachel: Logo, Name und Monatspreis – antippen dreht sie um, das Zahnrad öffnet die Einstellungen. */
export function SubscriptionTile({
  subscription,
  category,
  baseCurrency,
  rates,
  onSelect,
  flippable = true,
}: SubscriptionTileProps) {
  const [flipped, setFlipped] = useState(false);
  const { rotateY, face } = useCardFlip(flipped);
  const cards = useSettingsStore((st) => st.settings.paymentCards);
  const facts = useMemo(
    () => getSubscriptionFacts(subscription, baseCurrency, rates, cards, new Date()),
    [subscription, baseCurrency, rates, cards],
  );
  const toggleFlip = () => {
    if (flippable) setFlipped((value) => !value);
  };
  const today = new Date();
  const active = isActiveAt(subscription, today);
  const paused = active && isPausedAt(subscription, today);
  const inTrial = active && isInTrialAt(subscription, today);
  const running = active && !paused;
  const interval = getCurrentInterval(subscription, today);
  const status = getTileStatus(subscription, today);

  const isFree = active && interval !== undefined && (inTrial || interval.amount === 0);
  const showsAmount = active && interval !== undefined && !isFree;
  const monthly = paused
    ? getRegularMonthlyCost(subscription, baseCurrency, rates, today)
    : getMonthlyCost(subscription, baseCurrency, rates, today);
  const price = showsAmount ? formatCurrency(monthly, baseCurrency) : isFree ? 'Gratis' : '–';

  const front = (
    // Inhalt statt ganzer Karte abdunkeln: Unter 100 % Deckkraft schaltet Chrome den Glas-Blur ab.
    <div
      className={cn(
        'flex h-full flex-col items-center gap-2 px-2 pt-4 pb-3 text-center',
        !running && !paused && 'opacity-60',
      )}
    >
      {status && (
        <span
          title={status.label}
          className={cn(
            'absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full',
            status.className,
          )}
        >
          <status.icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      <SubscriptionLogo
        name={subscription.name}
        logoUrl={subscription.logoUrl}
        shape={subscription.logoShape}
        color={category?.color}
      />
      <span className="w-full min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight">{subscription.name}</span>
        <span
          className={cn(
            'block truncate text-xs tabular-nums',
            isFree ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400',
            paused && 'line-through',
          )}
        >
          {price}
          {showsAmount && '/Mt.'}
        </span>
      </span>
    </div>
  );

  return (
    <div className="relative h-full" style={brandColorStyle(subscription.brandColors)}>
      <motion.div style={{ rotateY, transformPerspective: 900 }} className="h-full">
        <GlassCard
          interactive={flippable}
          role={flippable ? 'button' : undefined}
          tabIndex={flippable ? 0 : undefined}
          aria-pressed={flipped}
          aria-label={`${subscription.name}, ${price}${showsAmount ? ' pro Monat' : ''}${status ? `, ${status.label}` : ''} – ${flipped ? 'Vorderseite' : 'Details'} zeigen`}
          onClick={toggleFlip}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            toggleFlip();
          }}
          className="h-full focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:outline-none"
        >
          <CardAura brandColors={subscription.brandColors} sleeping={paused} />
          <CardFaces face={face} sleeping={paused} front={front} back={<SubscriptionTileBack facts={facts} />} />
        </GlassCard>
      </motion.div>
      {onSelect && (
        <CardSettingsButton
          size="sm"
          label={`${subscription.name} bearbeiten`}
          onPress={() => onSelect(subscription)}
        />
      )}
    </div>
  );
}
