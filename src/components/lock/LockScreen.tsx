import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ScanFace } from 'lucide-react';
import { useLockStore } from '../../store/useLockStore';
import { MAX_PIN_ATTEMPTS, PIN_LOCKOUT_MS, verifyPin } from '../../utils/appLock';
import { sheetSpring } from '../../utils/motion';
import { promptBiometricAuth } from '../../utils/webauthn';
import { PinPad } from './PinPad';

const APP_ICON_URL = `${import.meta.env.BASE_URL}pwa-192x192.png`;

/** Vollflächige Sperre; schwingt nach erfolgreichem Entsperren nach oben weg. */
export function LockScreen() {
  const config = useLockStore((s) => s.config);
  const unlock = useLockStore((s) => s.unlock);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [checkingBiometric, setCheckingBiometric] = useState(false);

  const secondsLeft = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  const autoPromptedRef = useRef(false);
  const credentialId = config?.credentialId;

  useEffect(() => {
    if (blockedUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [blockedUntil]);

  const tryBiometric = async (automatic = false) => {
    if (!credentialId || checkingBiometric) return;
    setCheckingBiometric(true);
    setMessage(null);
    const ok = await promptBiometricAuth(credentialId);
    setCheckingBiometric(false);
    if (ok) unlock();
    else
      setMessage(
        automatic ? 'Tippe auf das Gesichts-Symbol oder gib deinen PIN ein.' : 'Nicht erkannt – entsperre mit deinem PIN.',
      );
  };

  // Face ID / Fingerabdruck sofort anbieten, sobald der Sperrbildschirm erscheint (einmal pro Sperre).
  // Lehnt ein Browser das ohne Antippen ab, bleibt der Knopf als Weg zurück.
  useEffect(() => {
    if (!credentialId || autoPromptedRef.current || document.visibilityState !== 'visible') return;
    autoPromptedRef.current = true;
    void tryBiometric(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bewusst nur beim Erscheinen
  }, [credentialId]);

  if (!config) return null;

  const handlePin = async (pin: string) => {
    if (await verifyPin(config, pin)) {
      unlock();
      return true;
    }
    const next = attempts + 1;
    if (next >= MAX_PIN_ATTEMPTS) {
      setAttempts(0);
      setBlockedUntil(Date.now() + PIN_LOCKOUT_MS);
      setNow(Date.now());
      setMessage(null);
    } else {
      setAttempts(next);
      setMessage(`Falscher PIN – noch ${MAX_PIN_ATTEMPTS - next} ${MAX_PIN_ATTEMPTS - next === 1 ? 'Versuch' : 'Versuche'}.`);
    }
    return false;
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="HardCost ist gesperrt"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ y: '-100%' }}
      transition={sheetSpring}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 overflow-hidden bg-zinc-950 px-6 py-[max(2rem,env(safe-area-inset-top))] text-white"
    >
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sky-500/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-violet-500/25 blur-3xl" />

      <div className="relative flex flex-col items-center gap-3 text-center">
        <img src={APP_ICON_URL} alt="" className="h-16 w-16 rounded-2xl shadow-2xl shadow-violet-500/30" />
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Lock className="h-4 w-4 text-white/60" aria-hidden />
          HardCost ist gesperrt
        </h1>
        <p className="min-h-5 text-sm text-white/60" aria-live="polite">
          {secondsLeft > 0
            ? `Zu viele Versuche – warte ${secondsLeft} s.`
            : (message ?? (credentialId ? 'Mit Face ID / Fingerabdruck oder PIN entsperren' : 'PIN eingeben'))}
        </p>
      </div>

      <div className="relative">
        <PinPad
          tone="dark"
          disabled={secondsLeft > 0}
          onSubmit={handlePin}
          extraKey={
            credentialId && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => void tryBiometric()}
                disabled={checkingBiometric}
                aria-label="Mit Face ID oder Fingerabdruck entsperren"
                title="Biometrisch entsperren"
                className="flex h-16 w-16 items-center justify-center rounded-full text-white/90 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                <ScanFace className="h-8 w-8" aria-hidden />
              </motion.button>
            )
          }
        />
      </div>
    </motion.div>
  );
}
