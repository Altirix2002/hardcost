import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { springWithFade } from '../../utils/motion';

/** Gespeicherte eigene Zahlungsarten; ein ✕ entfernt sie aus den Vorschlägen. */
export function PaymentMethodManager() {
  const methods = useSettingsStore((s) => s.settings.paymentMethods) ?? [];
  const forgetPaymentMethod = useSettingsStore((s) => s.forgetPaymentMethod);

  if (methods.length === 0) {
    return (
      <p className="px-1 text-sm text-zinc-500 dark:text-zinc-400">
        Noch keine eigenen. Tippst du im Abo eine neue Zahlungsart ein, erscheint sie hier und bei jedem neuen Abo als
        Vorschlag.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      <AnimatePresence initial={false}>
        {methods.map((method) => (
          <motion.li
            key={method}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={springWithFade}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-900/10 bg-white/50 pr-1 pl-3 text-sm font-medium dark:border-white/10 dark:bg-zinc-800/50"
          >
            {method}
            <button
              type="button"
              onClick={() => void forgetPaymentMethod(method)}
              aria-label={`${method} aus den Vorschlägen entfernen`}
              className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-900/5 hover:text-rose-500 dark:hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
