import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Delete } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PIN_LENGTH } from '../../utils/appLock';
import { triggerHaptic } from '../../utils/haptics';
import { spring } from '../../utils/motion';

interface PinPadProps {
  /** Liefert false bei falschem PIN – die Punkte schütteln sich und leeren sich. */
  onSubmit: (pin: string) => Promise<boolean> | boolean;
  disabled?: boolean;
  /** Freier Platz unten links, z.B. für den Face-ID-Knopf. */
  extraKey?: ReactNode;
  /** `dark` für den Sperrbildschirm, `auto` folgt dem Theme. */
  tone?: 'dark' | 'auto';
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** iOS-artiges Ziffernfeld; funktioniert auch mit der Tastatur (Ziffern, Rücktaste). */
export function PinPad({ onSubmit, disabled = false, extraKey, tone = 'auto' }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shake = useAnimationControls();
  const dark = tone === 'dark';
  const blocked = disabled || checking;

  useEffect(() => {
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  const submit = async (value: string) => {
    setChecking(true);
    const ok = await onSubmit(value);
    setChecking(false);
    if (ok) return;
    triggerHaptic(60);
    await shake.start({ x: [0, -12, 12, -8, 8, -4, 0], transition: { duration: 0.4 } });
    setPin('');
  };

  const press = (digit: string) => {
    if (blocked || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  };

  const remove = () => {
    if (!blocked) setPin((current) => current.slice(0, -1));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (/^\d$/.test(event.key)) press(event.key);
    else if (event.key === 'Backspace') remove();
    else return;
    event.preventDefault();
  };

  const key = cn(
    'flex h-16 w-16 items-center justify-center rounded-full text-2xl font-medium transition-colors select-none',
    'focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40',
    dark
      ? 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50'
      : 'bg-zinc-900/5 text-zinc-900 hover:bg-zinc-900/10 focus-visible:ring-sky-500/50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
  );

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="flex flex-col items-center gap-8 outline-none"
    >
      <motion.div animate={shake} className="flex gap-4" aria-live="polite" aria-label={`${pin.length} von ${PIN_LENGTH} Ziffern`}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <motion.span
            key={index}
            animate={{ scale: index < pin.length ? 1.15 : 1 }}
            transition={spring}
            className={cn(
              'h-3.5 w-3.5 rounded-full border-2 transition-colors',
              dark ? 'border-white/70' : 'border-zinc-400 dark:border-white/60',
              index < pin.length && (dark ? 'bg-white' : 'bg-zinc-900 dark:bg-white'),
            )}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {DIGITS.map((digit) => (
          <motion.button key={digit} type="button" whileTap={{ scale: 0.9 }} transition={spring} disabled={blocked} onClick={() => press(digit)} className={key}>
            {digit}
          </motion.button>
        ))}
        <div className="flex h-16 w-16 items-center justify-center">{extraKey}</div>
        <motion.button type="button" whileTap={{ scale: 0.9 }} transition={spring} disabled={blocked} onClick={() => press('0')} className={key}>
          0
        </motion.button>
        <button
          type="button"
          aria-label="Letzte Ziffer löschen"
          disabled={blocked || pin.length === 0}
          onClick={remove}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full transition-opacity disabled:opacity-0',
            dark ? 'text-white/80' : 'text-zinc-500 dark:text-zinc-300',
          )}
        >
          <Delete className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
