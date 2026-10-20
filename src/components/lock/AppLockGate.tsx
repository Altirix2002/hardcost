import { useEffect, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLockStore } from '../../store/useLockStore';
import { LOCK_GRACE_MS } from '../../utils/appLock';
import { LockScreen } from './LockScreen';

interface AppLockGateProps {
  children: ReactNode;
}

/**
 * Hängt die App erst nach dem Entsperren ein – solange gesperrt, stehen keine Finanzdaten im DOM.
 * Im Hintergrund deckt ein Sichtschutz die App ab (Vorschau im App-Umschalter); wer länger als
 * LOCK_GRACE_MS weg war, muss neu entsperren. Die Kulanzzeit verhindert, dass z.B. die
 * Dateiauswahl beim Hochladen eines Dokuments die App sperrt.
 */
export function AppLockGate({ children }: AppLockGateProps) {
  const enabled = useLockStore((s) => s.config?.enabled ?? false);
  const locked = useLockStore((s) => s.locked);
  const covered = useLockStore((s) => s.covered);
  const lock = useLockStore((s) => s.lock);
  const setCovered = useLockStore((s) => s.setCovered);

  useEffect(() => {
    if (!enabled) return;
    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        setCovered(true);
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= LOCK_GRACE_MS) lock();
      hiddenAt = null;
      setCovered(false);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [enabled, lock, setCovered]);

  return (
    <>
      {!locked && children}
      {covered && !locked && <div aria-hidden className="fixed inset-0 z-[90] bg-zinc-950" />}
      <AnimatePresence>{locked && <LockScreen key="lock" />}</AnimatePresence>
    </>
  );
}
