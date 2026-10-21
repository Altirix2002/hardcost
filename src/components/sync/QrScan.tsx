import { useEffect, useRef, useState } from 'react';
import { CameraOff, ClipboardPaste } from 'lucide-react';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';

interface QrScanProps {
  hint: string;
  onCode: (code: string) => void;
}

/**
 * Kamera-Scanner für Sync-Codes (qr-scanner, nutzt BarcodeDetector wo vorhanden). Ohne Kamera –
 * z.B. am PC ohne Webcam – lässt sich der Code auch einfügen (vom anderen Gerät kopiert/geteilt).
 */
export function QrScan({ hint, onCode }: QrScanProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let scanner: { stop: () => void; destroy: () => void } | null = null;
    let cancelled = false;
    let delivered = false;

    void import('qr-scanner')
      .then(async ({ default: QrScanner }) => {
        if (cancelled) return;
        if (!(await QrScanner.hasCamera())) {
          setCameraError('Keine Kamera gefunden – füge den Code unten ein.');
          return;
        }
        const instance = new QrScanner(
          video,
          (result) => {
            if (delivered || !result.data.startsWith('HC1|')) return;
            delivered = true;
            instance.stop();
            onCodeRef.current(result.data);
          },
          { returnDetailedScanResult: true, preferredCamera: 'environment', maxScansPerSecond: 12 },
        );
        scanner = instance;
        await instance.start();
      })
      .catch(() => {
        if (!cancelled) setCameraError('Kein Zugriff auf die Kamera – erlaube ihn oder füge den Code unten ein.');
      });

    return () => {
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">{hint}</p>
      {cameraError ? (
        <p className="flex items-center gap-2 rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          <CameraOff className="h-4 w-4 shrink-0" aria-hidden />
          {cameraError}
        </p>
      ) : (
        <div className="relative mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-3xl bg-zinc-950 shadow-inner">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {/* Sucher: zeigt, wohin der Code gehört. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]"
          />
        </div>
      )}
      <TextArea
        label="Oder Code einfügen"
        placeholder="HC1|…"
        rows={2}
        value={pasted}
        onChange={(event) => setPasted(event.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <Button variant="secondary" icon={ClipboardPaste} disabled={!pasted.trim()} onClick={() => onCode(pasted.trim())}>
        Code übernehmen
      </Button>
    </div>
  );
}
