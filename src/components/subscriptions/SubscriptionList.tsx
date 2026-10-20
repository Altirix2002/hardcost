import { AnimatePresence, motion } from 'framer-motion';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { springWithFade } from '../../utils/motion';
import { SwipeableSubscriptionCard } from './SwipeableSubscriptionCard';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

export function SubscriptionList({ subscriptions, categoriesById, baseCurrency, rates, onSelect }: SubscriptionListProps) {
  return (
    // popLayout: Verschwindet eine Karte (Filter, Löschen), gleiten die übrigen sofort nach.
    <ul className="relative grid gap-3 sm:grid-cols-2">
      <AnimatePresence initial={false} mode="popLayout">
        {subscriptions.map((subscription, index) => (
          <motion.li
            key={subscription.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { ...springWithFade, delay: index * 0.04 } }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={springWithFade}
            className="h-full"
          >
            <SwipeableSubscriptionCard
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
