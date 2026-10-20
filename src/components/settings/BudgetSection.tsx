import { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { parseAmount } from '../../utils/subscriptionDraft';
import { TextField } from '../ui/TextField';

/** Monatliches Limit für die Abo-Kosten; leer = kein Budget. */
export function BudgetSection() {
  const budget = useSettingsStore((s) => s.settings.monthlyBudget);
  const currency = useSettingsStore((s) => s.settings.baseCurrency);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [input, setInput] = useState(budget !== undefined ? String(budget) : '');
  const [error, setError] = useState<string | undefined>();

  const commit = () => {
    if (input.trim() === '') {
      setError(undefined);
      void updateSettings({ monthlyBudget: undefined });
      return;
    }
    const amount = parseAmount(input);
    if (amount === null || amount <= 0) {
      setError('Betrag grösser als 0 – oder leer lassen.');
      return;
    }
    setError(undefined);
    void updateSettings({ monthlyBudget: amount });
  };

  return (
    <TextField
      label={`Monatsbudget (${currency})`}
      placeholder="z.B. 80"
      inputMode="decimal"
      hint="Optional – die Übersicht warnt ab 90 % und zeigt, wenn das Budget überschritten ist."
      value={input}
      onChange={(event) => setInput(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      error={error}
    />
  );
}
