import { useState, type KeyboardEvent } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { DEFAULT_COST_RATIO_THRESHOLDS } from '../../utils/insights';
import { parseAmount } from '../../utils/subscriptionDraft';
import { TextField } from '../ui/TextField';

const toPercentInput = (share: number) => String(Math.round(share * 1000) / 10);

/** Nettoeinkommen und Ampel-Grenzen der Fixkosten-Quote. */
export function IncomeSection() {
  const income = useSettingsStore((s) => s.settings.netIncome);
  const thresholds = useSettingsStore((s) => s.settings.costRatioThresholds) ?? DEFAULT_COST_RATIO_THRESHOLDS;
  const currency = useSettingsStore((s) => s.settings.baseCurrency);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [incomeInput, setIncomeInput] = useState(income !== undefined ? String(income) : '');
  const [greenInput, setGreenInput] = useState(toPercentInput(thresholds.green));
  const [yellowInput, setYellowInput] = useState(toPercentInput(thresholds.yellow));
  const [incomeError, setIncomeError] = useState<string | undefined>();
  const [thresholdError, setThresholdError] = useState<string | undefined>();

  const commitIncome = () => {
    if (incomeInput.trim() === '') {
      setIncomeError(undefined);
      void updateSettings({ netIncome: undefined });
      return;
    }
    const amount = parseAmount(incomeInput);
    if (amount === null || amount <= 0) {
      setIncomeError('Betrag grösser als 0 – oder leer lassen.');
      return;
    }
    setIncomeError(undefined);
    void updateSettings({ netIncome: amount });
  };

  const commitThresholds = () => {
    const green = parseAmount(greenInput);
    const yellow = parseAmount(yellowInput);
    if (green === null || yellow === null || green <= 0 || yellow > 100 || green >= yellow) {
      setThresholdError('Grün muss unter Gelb liegen, beide zwischen 0 und 100 %.');
      return;
    }
    setThresholdError(undefined);
    const isDefault =
      green / 100 === DEFAULT_COST_RATIO_THRESHOLDS.green && yellow / 100 === DEFAULT_COST_RATIO_THRESHOLDS.yellow;
    void updateSettings({ costRatioThresholds: isDefault ? undefined : { green: green / 100, yellow: yellow / 100 } });
  };

  const blurOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
  };

  return (
    <>
      <TextField
        label={`Nettoeinkommen pro Monat (${currency})`}
        placeholder="z.B. 5200"
        inputMode="decimal"
        hint="Optional – die Übersicht zeigt dann, welchen Anteil deines Einkommens die Abos fressen."
        value={incomeInput}
        onChange={(event) => setIncomeInput(event.target.value)}
        onBlur={commitIncome}
        onKeyDown={blurOnEnter}
        error={incomeError}
      />
      <div className="grid grid-cols-2 items-start gap-3">
        <TextField
          label="Grün bis (%)"
          inputMode="decimal"
          value={greenInput}
          onChange={(event) => setGreenInput(event.target.value)}
          onBlur={commitThresholds}
          onKeyDown={blurOnEnter}
        />
        <TextField
          label="Gelb bis (%)"
          inputMode="decimal"
          hint="Darüber rot"
          value={yellowInput}
          onChange={(event) => setYellowInput(event.target.value)}
          onBlur={commitThresholds}
          onKeyDown={blurOnEnter}
        />
      </div>
      {thresholdError && <p className="-mt-2 px-1 text-xs text-rose-600 dark:text-rose-400">{thresholdError}</p>}
    </>
  );
}
