import { useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Download, Upload } from 'lucide-react';
import { backupFileName, createBackup, restoreBackup } from '../../services/backup';
import type { BackupFile } from '../../types';
import { parseBackup } from '../../utils/backupValidation';
import { cn } from '../../utils/cn';
import { downloadTextFile } from '../../utils/download';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { formatDate } from '../../utils/format';
import { sheetSpring } from '../../utils/motion';
import { Button } from '../ui/Button';

interface BackupSectionProps {
  /** Wird nach erfolgreichem Import aufgerufen (z.B. um Einstellungen neu zu laden). */
  onRestored: () => Promise<void>;
}

type Status = { kind: 'success' | 'error'; message: string } | null;

export function BackupSection({ onRestored }: BackupSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setStatus(null);
    const backup = await createBackup();
    downloadTextFile(backupFileName(), JSON.stringify(backup, null, 2));
    setStatus({ kind: 'success', message: `${backup.subscriptions.length} Abos exportiert.` });
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStatus(null);
    try {
      setPending(parseBackup(await file.text()));
    } catch (cause) {
      setPending(null);
      setStatus({ kind: 'error', message: cause instanceof Error ? cause.message : 'Backup konnte nicht gelesen werden.' });
    }
  };

  const handleRestore = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      await onRestored();
      setStatus({
        kind: 'success',
        message: `${pending.subscriptions.length} Abos und ${pending.categories.length} Kategorien wiederhergestellt.`,
      });
      setPending(null);
    } catch {
      setStatus({ kind: 'error', message: 'Import fehlgeschlagen – deine bisherigen Daten sind unverändert.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={Download} onClick={() => void handleExport()}>
          Exportieren
        </Button>
        <Button variant="secondary" icon={Upload} onClick={() => inputRef.current?.click()}>
          Importieren
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void handleFile(event)}
      />

      <AnimatePresence initial={false}>
        {pending && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={sheetSpring}
            className="overflow-hidden"
          >
            <div className={cn(INSET_PANEL, 'flex flex-col gap-3')}>
              <p className="text-sm">
                Backup vom <strong>{formatDate(new Date(pending.exportedAt), true)}</strong> mit{' '}
                {pending.subscriptions.length} Abos und {pending.categories.length} Kategorien.
              </p>
              <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Alle aktuellen Abos und Kategorien werden dabei ersetzt.
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                  Abbrechen
                </Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => void handleRestore()}>
                  Daten ersetzen
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {status && (
          <motion.p
            key={status.message}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role={status.kind === 'error' ? 'alert' : 'status'}
            className={cn(
              'flex items-center gap-2 px-1 text-sm',
              status.kind === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400',
            )}
          >
            {status.kind === 'error' ? (
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {status.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
