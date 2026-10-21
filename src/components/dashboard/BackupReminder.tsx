import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HardDriveDownload } from 'lucide-react';
import { daysBetween } from '../../utils/dates';
import { sheetSpringWithFade } from '../../utils/motion';
import { Button } from '../ui/Button';

interface BackupReminderProps {
  lastBackupAt?: string;
  subscriptionCount: number;
  onBackup: () => void;
}

/** Ab so vielen Tagen seit dem letzten Backup erscheint die Erinnerung. */
const REMIND_AFTER_DAYS = 30;
/** "Später" blendet sie so lange aus. */
const SNOOZE_DAYS = 7;
/** Ohne jedes Backup erst ab einer Handvoll Abos erinnern – nicht gleich nach dem ersten. */
const MIN_SUBSCRIPTIONS_WITHOUT_BACKUP = 3;
const SNOOZE_KEY = 'hardcost-backup-snooze';

function readSnooze(): number {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Erinnert an ein Backup, weil alle Daten nur lokal im Browser liegen. */
export function BackupReminder({ lastBackupAt, subscriptionCount, onBackup }: BackupReminderProps) {
  const [snoozedUntil, setSnoozedUntil] = useState(readSnooze);
  const today = new Date();
  const daysSince = lastBackupAt ? daysBetween(new Date(lastBackupAt), today) : null;
  // Einmal angezeigt, bleibt sie stehen – sonst verschwände sie mitten beim Löschen, sobald es
  // weniger als drei Abos sind (und die Seite würde zusätzlich springen).
  const [shown, setShown] = useState(false);
  const due =
    daysSince === null
      ? subscriptionCount >= MIN_SUBSCRIPTIONS_WITHOUT_BACKUP || shown
      : daysSince >= REMIND_AFTER_DAYS;
  const visible = due && subscriptionCount > 0 && Date.now() > snoozedUntil;
  if (visible && !shown) setShown(true);

  const snooze = () => {
    const until = Date.now() + SNOOZE_DAYS * 86_400_000;
    setSnoozedUntil(until);
    try {
      localStorage.setItem(SNOOZE_KEY, String(until));
    } catch {
      // Ohne Speicher erscheint die Erinnerung beim nächsten Start wieder – unkritisch.
    }
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.section
          aria-label="Backup-Erinnerung"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={sheetSpringWithFade}
          // Trägt seinen Abstand selbst (Polster innen, negativer Rand aussen): Beim Ein-/Ausklappen
          // wächst bzw. schrumpft der 24-px-Abstand mit, statt beim Einfügen/Entfernen zu springen.
          // Kein Scroll-Anker hierin: Wählt Chrome ein Element, das gerade zusammenklappt, als Anker,
          // springt die Seite (ganz unten gescrollt gemessen: 60 px).
          className="-mb-6 overflow-hidden [overflow-anchor:none]"
        >
          <div className="pb-6">
            <div className="flex flex-col gap-3 rounded-3xl border border-sky-500/30 bg-sky-50/70 p-4 shadow-lg shadow-sky-900/5 inset-shadow-2xs inset-shadow-white/70 sm:flex-row sm:items-center sm:backdrop-blur-md dark:border-sky-400/20 dark:bg-sky-950/40 dark:inset-shadow-white/10">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <HardDriveDownload className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold tracking-tight text-sky-950 dark:text-sky-100">
                    {daysSince === null ? 'Noch kein Backup' : `Letztes Backup vor ${daysSince} Tagen`}
                  </p>
                  <p className="text-xs text-sky-900/70 dark:text-sky-200/70">
                    Deine Abos liegen nur in diesem Browser – sichere sie, damit nichts verloren geht.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={snooze}>
                  Später
                </Button>
                <Button size="sm" onClick={onBackup}>
                  Jetzt sichern
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
