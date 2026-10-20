import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { softSpring, springWithFade } from '../../utils/motion';
import { SubscriptionTile } from './SubscriptionTile';

interface SubscriptionTileGridProps {
  subscriptions: Subscription[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

/** Versatz, wenn viele Kacheln zugleich erscheinen (Filter, Ansicht gewechselt). */
const STAGGER = 0.03;

const TILE_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (index: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { ...springWithFade, delay: Math.min(index, 15) * STAGGER },
  }),
  exit: { opacity: 0, scale: 0.85, transition: { ...springWithFade, opacity: { duration: 0.15 } } },
};

/**
 * Kompaktes Raster. Anders als bei der Liste würde Zusammenklappen hier nichts bringen (eine Kachel
 * teilt sich die Zeile mit anderen). Stattdessen: Die verschwindende Kachel schrumpft an Ort und Stelle
 * (popLayout), die übrigen gleiten sofort auf ihre neuen Plätze (layout). Die Gesamthöhe gleitet per
 * AutoHeight in der Übersicht mit – fällt ganz unten eine Zeile weg, gibt es so keinen Scroll-Sprung.
 */
export function SubscriptionTileGrid({
  subscriptions,
  categoriesById,
  baseCurrency,
  rates,
  onSelect,
}: SubscriptionTileGridProps) {
  return (
    <ul className="relative grid grid-cols-3 gap-2 pb-3 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
      <AnimatePresence initial={false} mode="popLayout">
        {subscriptions.map((subscription, index) => (
          <motion.li
            key={subscription.id}
            layout
            custom={index}
            variants={TILE_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            // Sanfter beim Weitergleiten: Kacheln wandern im Raster teils schräg über mehrere Plätze.
            transition={softSpring}
          >
            <SubscriptionTile
              subscription={subscription}
              category={categoriesById.get(subscription.categoryId)}
              baseCurrency={baseCurrency}
              rates={rates}
              onSelect={onSelect}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
