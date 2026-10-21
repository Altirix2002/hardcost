import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Copy,
  Loader2,
  RotateCcw,
  ScanLine,
  Share2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { createBackupZip, readBackupFile, restoreBackup } from '../../services/backup';
import { PeerLink, receiveBackupOver, replyToSender, sendBackupOver } from '../../services/peerSync';
import type { ParsedBackup, SyncDirection, SyncStage } from '../../types';
import { cn } from '../../utils/cn';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { sheetSpringWithFade } from '../../utils/motion';
import { Button } from '../ui/Button';
import { QrCode } from './QrCode';
import { QrScan } from './QrScan';

interface SyncPanelProps {
  /** Nach dem Übernehmen: Einstellungen neu laden (wie nach einem Backup-Import). */
  onRestored: () => Promise<void>;
}

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : 'Das hat nicht geklappt.');

/** Code als Text weitergeben – für Geräte ohne Kamera (z.B. PC ohne Webcam). */
function CodeActions({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator.share === 'function';

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        icon={copied ? Check : Copy}
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(() => setCopied(true));
        }}
      >
        {copied ? 'Kopiert' : 'Code kopieren'}
      </Button>
      {canShare && (
        <Button
          size="sm"
          variant="secondary"
          icon={Share2}
          onClick={() => void navigator.share({ text: code }).catch(() => undefined)}
        >
          Teilen
        </Button>
      )}
    </div>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {text}
    </p>
  );
}

/**
 * Serverloser Geräte-Sync: zwei QR-Codes tauschen, dann gehen alle Abos, Kategorien, Einstellungen
 * und Dokumente direkt von Gerät zu Gerät (WebRTC, verschlüsselt). Der Empfänger bestätigt vor dem
 * Ersetzen. Die App-Sperre bleibt pro Gerät.
 */
export function SyncPanel({ onRestored }: SyncPanelProps) {
  const [stage, setStage] = useState<SyncStage>({ step: 'idle' });
  const linkRef = useRef<PeerLink | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const parsedRef = useRef<ParsedBackup | null>(null);
  // Richtung des Startgeräts – beim Antwort-Scan ist der Angebots-Code schon nicht mehr sichtbar.
  const directionRef = useRef<SyncDirection>('send');

  const reset = () => {
    linkRef.current?.close();
    linkRef.current = null;
    channelRef.current = null;
    parsedRef.current = null;
    setStage({ step: 'idle' });
  };

  // Einstellungen geschlossen: Verbindung sauber beenden.
  useEffect(() => () => linkRef.current?.close(), []);

  const fail = (cause: unknown) => {
    linkRef.current?.close();
    linkRef.current = null;
    setStage({ step: 'error', message: errorMessage(cause) });
  };

  /** Sobald der Kanal offen ist: senden bzw. empfangen. */
  const runTransfer = async (link: PeerLink, receiving: boolean) => {
    const channel = await link.channel;
    channelRef.current = channel;
    setStage({ step: 'transfer', receiving, progress: 0 });

    if (!receiving) {
      const zip = await createBackupZip();
      const accepted = await sendBackupOver(
        channel,
        { blob: zip.blob, subscriptions: zip.backup.subscriptions.length, documents: zip.documentCount },
        (progress) => setStage({ step: 'transfer', receiving: false, progress }),
      );
      link.close();
      setStage({
        step: 'done',
        message: accepted
          ? `${zip.backup.subscriptions.length} Abos übertragen – das andere Gerät ist jetzt auf dem gleichen Stand.`
          : 'Das andere Gerät hat die Übernahme abgelehnt.',
      });
      return;
    }

    const blob = await receiveBackupOver(
      channel,
      () => undefined,
      (progress) => setStage({ step: 'transfer', receiving: true, progress }),
    );
    const parsed = await readBackupFile(new File([blob], 'hardcost-sync.zip', { type: 'application/zip' }));
    parsedRef.current = parsed;
    setStage({
      step: 'confirm',
      subscriptions: parsed.backup.subscriptions.length,
      documents: parsed.documents?.length ?? 0,
    });
  };

  const startAsInitiator = async (direction: SyncDirection) => {
    setStage({ step: 'preparing' });
    directionRef.current = direction;
    try {
      const { link, code } = await PeerLink.createOffer(direction);
      linkRef.current = link;
      setStage({ step: 'show-offer', code, direction });
    } catch (cause) {
      fail(cause);
    }
  };

  const handleAnswer = async (code: string) => {
    const link = linkRef.current;
    if (!link) return;
    setStage({ step: 'connecting' });
    try {
      await link.acceptAnswer(code);
      await runTransfer(link, directionRef.current === 'receive');
    } catch (cause) {
      fail(cause);
    }
  };

  const handleOffer = async (code: string) => {
    setStage({ step: 'preparing' });
    try {
      const { link, code: answer, direction: offered } = await PeerLink.acceptOffer(code);
      linkRef.current = link;
      // Sendet das Startgerät, empfängt dieses hier – und umgekehrt.
      const receiving = offered === 'send';
      setStage({ step: 'show-answer', code: answer, receiving });
      await runTransfer(link, receiving);
    } catch (cause) {
      fail(cause);
    }
  };

  const confirm = async (accept: boolean) => {
    const channel = channelRef.current;
    const parsed = parsedRef.current;
    if (!channel || !parsed) return;
    if (!accept) {
      replyToSender(channel, 'declined');
      window.setTimeout(() => linkRef.current?.close(), 500);
      setStage({ step: 'done', message: 'Nichts übernommen – deine Daten hier sind unverändert.' });
      return;
    }
    try {
      await restoreBackup(parsed);
      await onRestored();
      replyToSender(channel, 'ack');
      setStage({ step: 'done', message: `${parsed.backup.subscriptions.length} Abos übernommen.` });
    } catch (cause) {
      replyToSender(channel, { error: 'Das Übernehmen ist fehlgeschlagen.' });
      fail(cause);
    } finally {
      // Kurz offen lassen, damit die Rückmeldung beim Sender ankommt.
      window.setTimeout(() => linkRef.current?.close(), 500);
    }
  };

  const content = (() => {
    switch (stage.step) {
      case 'idle':
        return (
          <div className="flex flex-col gap-2">
            <Button variant="secondary" icon={ArrowUpFromLine} onClick={() => void startAsInitiator('send')}>
              Daten von hier senden
            </Button>
            <Button variant="secondary" icon={ArrowDownToLine} onClick={() => void startAsInitiator('receive')}>
              Daten auf dieses Gerät holen
            </Button>
            <Button variant="ghost" icon={ScanLine} onClick={() => setStage({ step: 'scan-offer' })}>
              Code des anderen Geräts scannen
            </Button>
          </div>
        );
      case 'preparing':
        return <Waiting text="Verbindung wird vorbereitet …" />;
      case 'show-offer':
        return (
          <div className="flex flex-col gap-4">
            <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">
              <b>1.</b> Auf dem anderen Gerät: HardCost → Einstellungen → Geräte-Sync → «Code des anderen Geräts
              scannen» und diesen Code scannen.
            </p>
            <QrCode value={stage.code} label="Sync-Code dieses Geräts" />
            <CodeActions code={stage.code} />
            <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">
              <b>2.</b> Das andere Gerät zeigt danach einen Antwort-Code.
            </p>
            <Button icon={ScanLine} onClick={() => setStage({ step: 'scan-answer' })}>
              Antwort scannen
            </Button>
          </div>
        );
      case 'scan-answer':
        return (
          <QrScan
            hint="Scanne den Antwort-Code, den das andere Gerät jetzt zeigt."
            onCode={(code) => void handleAnswer(code)}
          />
        );
      case 'scan-offer':
        return <QrScan hint="Scanne den Code, den das andere Gerät zeigt." onCode={(code) => void handleOffer(code)} />;
      case 'show-answer':
        return (
          <div className="flex flex-col gap-4">
            <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">
              Scanne diesen Antwort-Code jetzt mit dem anderen Gerät («Antwort scannen»).
              {stage.receiving && ' Du bestätigst, bevor hier etwas ersetzt wird.'}
            </p>
            <QrCode value={stage.code} label="Antwort-Code dieses Geräts" />
            <CodeActions code={stage.code} />
            <Waiting text="Warte auf das andere Gerät …" />
          </div>
        );
      case 'connecting':
        return <Waiting text="Geräte verbinden sich …" />;
      case 'transfer':
        return (
          <div className="flex flex-col gap-2">
            <p className="px-1 text-sm font-medium">
              {stage.receiving ? 'Daten werden empfangen …' : 'Daten werden gesendet …'}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
              <motion.div
                className="bg-brand-gradient h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(stage.progress * 100)}%` }}
              />
            </div>
            {!stage.receiving && stage.progress >= 1 && <Waiting text="Warte auf die Bestätigung …" />}
          </div>
        );
      case 'confirm':
        return (
          <div className="flex flex-col gap-3">
            <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Angekommen: {stage.subscriptions} Abos
                {stage.documents > 0 && ` und ${stage.documents} Dokumente`}. Übernehmen ersetzt alle Abos, Kategorien,
                Einstellungen und Dokumente auf diesem Gerät.
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => void confirm(false)}>
                Ablehnen
              </Button>
              <Button icon={Check} onClick={() => void confirm(true)}>
                Übernehmen
              </Button>
            </div>
          </div>
        );
      case 'done':
        return (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Check className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-sm font-medium">{stage.message}</p>
            <Button size="sm" variant="ghost" onClick={reset}>
              Fertig
            </Button>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400">{stage.message}</p>
            <Button size="sm" variant="secondary" icon={RotateCcw} onClick={reset}>
              Nochmals
            </Button>
          </div>
        );
    }
  })();

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stage.step}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={sheetSpringWithFade}
          className="overflow-hidden"
        >
          <div className={cn(stage.step !== 'idle' && INSET_PANEL)}>{content}</div>
        </motion.div>
      </AnimatePresence>
      {stage.step !== 'idle' && stage.step !== 'done' && (
        <Button size="sm" variant="ghost" icon={X} onClick={reset} className="self-center">
          Abbrechen
        </Button>
      )}
    </div>
  );
}
