import { AnimatePresence, motion } from 'framer-motion';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { spring } from '../../utils/motion';
import { SubscriptionCard } from './SubscriptionCard';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
  onSelect?: (subscription: Subscription) => void;
}

export function SubscriptionList({ subscriptions, categoriesById, baseCurrency, rates, onSelect }: SubscriptionListProps) {
  return (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {subscriptions.map((subscription, index) => (
          <motion.li
            key={subscription.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { ...spring, delay: index * 0.04 } }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={spring}
          >
            <SubscriptionCard
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
