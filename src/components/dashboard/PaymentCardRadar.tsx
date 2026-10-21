import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, CreditCard } from 'lucide-react';
import type { PaymentCardAlert, Subscription } from '../../types';
import { cn } from '../../utils/cn';
import { formatDate, formatRelativeDays } from '../../utils/format';
import { collapseItemVariants, spring } from '../../utils/motion';
import { PAYMENT_CARD_KIND_LABELS, formatCardExpiry } from '../../utils/paymentCards';
import { AlertPanel } from '../ui/AlertPanel';

interface PaymentCardRadarProps {
  alerts: PaymentCardAlert[];
  /** Karte läuft ab: Einstellungen öffnen (neues Ablaufdatum eintragen). */
  onOpenCards: () => void;
  /** Wegwerfkarte: das betroffene Abo öffnen (neue Karte hinterlegen). */
  onSelect: (subscription: Subscription) => void;
}

function describe(alert: PaymentCardAlert): { title: string; detail: string } {
  const { card, reason, subscriptions } = alert;
  const count = subscriptions.length === 1 ? '1 Abo bucht' : `${subscriptions.length} Abos buchen`;
  const name = card.lastFour ? `${card.method} •••• ${card.lastFour}` : card.method;
  if (reason === 'expired') return { title: name, detail: `Abgelaufen · ${count} noch darüber ab` };
  if (reason === 'expiring') {
    return { title: name, detail: `Läuft Ende ${formatCardExpiry(card.expiresAt ?? '')} ab · ${count} darüber ab` };
  }
  const sub = subscriptions[0];
  const action = card.kind === 'single-use' ? 'neue Karte hinterlegen' : 'Guthaben/Limit prüfen';
  return {
    title: sub?.name ?? name,
    detail: `${PAYMENT_CARD_KIND_LABELS[card.kind]} · Abbuchung am ${formatDate(alert.date, true)} – ${action}`,
  };
}

/** Warnt, bevor Abbuchungen an abgelaufenen oder verbrauchten Karten scheitern. */
export function PaymentCardRadar({ alerts, onOpenCards, onSelect }: PaymentCardRadarProps) {
  const urgent = alerts.some((alert) => alert.reason === 'expired' || alert.daysLeft <= 3);

  return (
    <AlertPanel
      open={alerts.length > 0}
      tone={urgent ? 'rose' : 'violet'}
      icon={CreditCard}
      label="Karten-Radar"
      title="Karten-Radar"
      subtitle={
        alerts.length === 1 ? 'Eine Zahlung könnte scheitern.' : `${alerts.length} Zahlungen könnten scheitern.`
      }
    >
      <AnimatePresence initial={false}>
        {alerts.map((alert) => {
          const { title, detail } = describe(alert);
          const sub = alert.reason === 'renewal' ? alert.subscriptions[0] : undefined;
          const danger = alert.reason === 'expired' || alert.daysLeft <= 3;
          return (
            <motion.li
              key={`${alert.reason}-${alert.card.method}-${sub?.id ?? ''}`}
              layout="position"
              variants={collapseItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={spring}
            >
              <div className="pb-2">
                <motion.button
                  type="button"
                  onClick={() => (sub ? onSelect(sub) : onOpenCards())}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/60 p-2 pr-3 text-left transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:outline-none dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      danger ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
                    )}
                  >
                    <CreditCard className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{title}</span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{detail}</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-semibold',
                      danger ? 'text-rose-600 dark:text-rose-400' : 'text-violet-700 dark:text-violet-300',
                    )}
                  >
                    {alert.daysLeft < 0 ? 'Abgelaufen' : alert.daysLeft === 0 ? 'Heute' : formatRelativeDays(alert.daysLeft)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                </motion.button>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </AlertPanel>
  );
}
