import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { spring } from '../../utils/motion';
import { SwipeableSubscriptionCard } from './SwipeableSubscriptionCard';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

/** Kritisch gedämpft: klappt weich zusammen, ohne unter 0 zu schwingen. */
const collapse: Transition = { type: 'spring', stiffness: 320, damping: 38, mass: 0.9 };

/**
 * Karten klappen beim Verschwinden (Löschen, Filter) auf Höhe 0 zusammen, statt aus dem Fluss
 * zu springen. So schrumpft die Seite Pixel für Pixel und die übrigen Karten gleiten nach – auch
 * ganz unten, wo der Browser sonst die Scroll-Position ruckartig korrigieren müsste.
 * Überlauf wird nur während der Animation abgeschnitten, damit Schatten und Hover-Lift sichtbar bleiben.
 */
const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, height: 0, scale: 0.96, overflow: 'hidden' },
  visible: (index: number) => ({
    opacity: 1,
    height: 'auto',
    scale: 1,
    overflow: 'hidden',
    transitionEnd: { overflow: 'visible' },
    transition: {
      height: collapse,
      scale: spring,
      opacity: { duration: 0.25, ease: 'easeOut' },
      delay: Math.min(index, 8) * 0.03,
    },
  }),
  exit: {
    opacity: 0,
    height: 0,
    scale: 0.96,
    overflow: 'hidden',
    transition: { height: collapse, scale: spring, opacity: { duration: 0.18, ease: 'easeOut' } },
  },
};

export function SubscriptionList({ subscriptions, categoriesById, baseCurrency, rates, onSelect }: SubscriptionListProps) {
  return (
    <ul className="grid sm:grid-cols-2 sm:gap-x-3">
      <AnimatePresence initial={false}>
        {subscriptions.map((subscription, index) => (
          <motion.li
            key={subscription.id}
            // Nur die Position animieren (Sortieren) – die Höhe steuern die Varianten.
            layout="position"
            custom={index}
            variants={ITEM_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={spring}
          >
            {/* Abstand als Teil des Inhalts: Ein Innenabstand am li würde Framer beim Zusammenklappen
                herausrechnen – dann bliebe er stehen und fiele am Ende ruckartig weg. */}
            <div className="h-full pb-3">
              <SwipeableSubscriptionCard
                subscription={subscription}
                category={categoriesById.get(subscription.categoryId)}
                baseCurrency={baseCurrency}
                rates={rates}
                onSelect={onSelect}
              />
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
