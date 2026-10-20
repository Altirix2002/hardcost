import { useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useLockStore } from '../../store/useLockStore';
import { createLockConfig } from '../../utils/appLock';
import { cn } from '../../utils/cn';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { checkBiometricSupport, registerBiometric } from '../../utils/webauthn';
import { PinPad } from '../lock/PinPad';
import { Button } from '../ui/Button';
import { Collapse } from '../ui/Collapse';
import { Toggle } from '../ui/Toggle';

type SetupStep = 'idle' | 'enter' | 'confirm';

/** PIN festlegen, Face ID / Fingerabdruck koppeln, Sperre ein- und ausschalten. */
export function AppLockSection() {
  const config = useLockStore((s) => s.config);
  const setConfig = useLockStore((s) => s.setConfig);
  const lock = useLockStore((s) => s.lock);
  const enabled = config?.enabled ?? false;

  const [step, setStep] = useState<SetupStep>('idle');
  const [firstPin, setFirstPin] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void checkBiometricSupport().then(setBiometricSupported);
  }, []);

  const startSetup = () => {
    setMessage(null);
    setFirstPin('');
    setStep('enter');
  };

  const confirmPin = async (pin: string) => {
    if (pin !== firstPin) {
      setMessage('Die PINs stimmen nicht überein – bitte neu wählen.');
      setFirstPin('');
      setStep('enter');
      return false;
    }
    // Beim Ändern des PINs bleibt eine gekoppelte Biometrie erhalten.
    setConfig(await createLockConfig(pin, config?.credentialId));
    setStep('idle');
    setMessage(enabled ? 'PIN geändert.' : 'App-Sperre ist aktiv.');
    return true;
  };

  const toggleBiometric = async (on: boolean) => {
    if (!config) return;
    if (!on) {
      setConfig({ ...config, credentialId: undefined });
      return;
    }
    setBusy(true);
    setMessage(null);
    const credentialId = await registerBiometric();
    setBusy(false);
    if (credentialId) setConfig({ ...config, credentialId });
    else setMessage('Face ID / Fingerabdruck wurde nicht eingerichtet.');
  };

  return (
    <div className="flex flex-col gap-4">
      <Toggle
        label="App-Sperre"
        description="Beim Öffnen und nach 30 s im Hintergrund PIN oder Face ID / Fingerabdruck verlangen."
        checked={enabled || step !== 'idle'}
        onChange={(on) => {
          if (on) startSetup();
          else {
            setStep('idle');
            setConfig(null);
            setMessage(null);
          }
        }}
      />

      <Collapse open={step !== 'idle'}>
        <div className={cn(INSET_PANEL, 'flex flex-col items-center gap-5 py-6')}>
          <div className="flex w-full items-start justify-between gap-3">
            <p className="text-sm font-medium">
              {step === 'enter'
                ? enabled
                  ? 'Neuen 4-stelligen PIN wählen'
                  : 'Wähle einen 4-stelligen PIN'
                : 'PIN zur Bestätigung wiederholen'}
            </p>
            <button
              type="button"
              aria-label="Abbrechen"
              onClick={() => setStep('idle')}
              className="-mt-1 -mr-1 rounded-full p-1 text-zinc-500 hover:bg-zinc-900/5 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <PinPad
            key={step}
            onSubmit={(pin) => {
              if (step === 'enter') {
                setFirstPin(pin);
                setMessage(null);
                setStep('confirm');
                return true;
              }
              return confirmPin(pin);
            }}
          />
        </div>
      </Collapse>

      {enabled && step === 'idle' && (
        <>
          {biometricSupported && (
            <Toggle
              label="Face ID / Fingerabdruck"
              description="Schneller entsperren; der PIN bleibt als Ausweichlösung."
              checked={config?.credentialId !== undefined}
              onChange={(on) => void toggleBiometric(on)}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={startSetup} disabled={busy}>
              PIN ändern
            </Button>
            <Button size="sm" variant="secondary" icon={Lock} onClick={lock} disabled={busy}>
              Jetzt sperren
            </Button>
          </div>
        </>
      )}

      {message && <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
    </div>
  );
}
