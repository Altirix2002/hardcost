import { useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Check, Ghost, Moon } from 'lucide-react';
import { confirmStillUsed, togglePause } from '../../services/subscriptionActions';
import type { Subscription } from '../../types';
import { cn } from '../../utils/cn';
import { spring } from '../../utils/motion';
import { Collapse } from '../ui/Collapse';

interface ZombieHintProps {
  subscription: Subscription;
}

const ACTION =
  'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none';

/** "Nutzt du das noch?" – Abo bestätigen oder direkt pausieren, ohne das Formular zu öffnen. */
export function ZombieHint({ subscription }: ZombieHintProps) {
  const [open, setOpen] = useState(false);

  // Die Karte selbst öffnet beim Antippen das Formular – Klicks hier nicht durchreichen.
  const handle = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    action();
  };

  return (
    <div>
      <motion.button
        type="button"
        aria-expanded={open}
        onClick={handle(() => setOpen((value) => !value))}
        whileTap={{ scale: 0.96 }}
        transition={spring}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-zinc-900/5 px-2.5 py-1 text-left text-xs font-medium text-zinc-600 hover:bg-zinc-900/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
      >
        <Ghost className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">6+ Monate unberührt – nutzt du das noch?</span>
      </motion.button>
      <Collapse open={open}>
        <div className="-mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handle(() => void confirmStillUsed(subscription))}
            className={cn(ACTION, 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300')}
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            Ja, nutze ich
          </button>
          <button
            type="button"
            onClick={handle(() => void togglePause(subscription))}
            className={cn(ACTION, 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300')}
          >
            <Moon className="h-3.5 w-3.5" aria-hidden />
            Jetzt pausieren
          </button>
        </div>
      </Collapse>
    </div>
  );
}
