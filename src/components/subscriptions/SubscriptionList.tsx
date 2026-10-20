import { AnimatePresence, motion } from 'framer-motion';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { collapseItemVariants, spring } from '../../utils/motion';
import { SwipeableSubscriptionCard } from './SwipeableSubscriptionCard';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

/** Karten klappen beim Löschen/Filtern weich zusammen (siehe collapseItemVariants). */
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
            variants={collapseItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={spring}
          >
            {/* Abstand als Teil des Inhalts, damit er beim Zusammenklappen mitschrumpft. */}
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
