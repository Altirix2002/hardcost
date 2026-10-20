import { useState } from 'react';
import { Monitor, Moon, RefreshCw, ShieldCheck, Sun } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { parseISODate } from '../../utils/dates';
import { formatDate } from '../../utils/format';
import { CURRENCY_OPTIONS } from '../../utils/options';
import { Button } from '../ui/Button';
import { FormSection } from '../ui/FormSection';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Select } from '../ui/Select';
import { AppLockSection } from './AppLockSection';
import { BackupSection } from './BackupSection';
import { BudgetSection } from './BudgetSection';
import { CategoryManager } from './CategoryManager';
import { PaymentMethodManager } from './PaymentMethodManager';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Hell', icon: Sun },
  { value: 'system' as const, label: 'System', icon: Monitor },
  { value: 'dark' as const, label: 'Dunkel', icon: Moon },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const settings = useSettingsStore((s) => s.settings);
  const rates = useSettingsStore((s) => s.rates);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setBaseCurrency = useSettingsStore((s) => s.setBaseCurrency);
  const refreshRates = useSettingsStore((s) => s.refreshRates);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshRates({ force: true });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Einstellungen"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>Fertig</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        <FormSection title="Darstellung">
          <SegmentedControl
            options={THEME_OPTIONS}
            value={settings.theme}
            onChange={(theme) => void setTheme(theme)}
            layoutId="settings-theme"
            ariaLabel="Erscheinungsbild"
          />
        </FormSection>

        <FormSection title="Währung">
          <Select
            label="Basiswährung"
            value={settings.baseCurrency}
            options={CURRENCY_OPTIONS}
            onChange={(currency) => void setBaseCurrency(currency)}
            hint="Alle Summen und Statistiken werden in diese Währung umgerechnet."
          />
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {rates
                ? `EZB-Kurse vom ${formatDate(parseISODate(rates.date), true)} (Frankfurter API)`
                : 'Noch keine Kurse geladen'}
            </p>
            <Button
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              disabled={refreshing}
              onClick={() => void handleRefresh()}
              className={refreshing ? '[&>svg]:animate-spin' : undefined}
            >
              Aktualisieren
            </Button>
          </div>
        </FormSection>

        <FormSection title="Budget">
          <BudgetSection key={settings.baseCurrency} />
        </FormSection>

        <FormSection
          title="Kategorien"
          description="Antippen zum Umbenennen oder Umfärben. Beim Löschen wandern die Abos zu «Sonstiges»."
        >
          <CategoryManager />
        </FormSection>

        <FormSection
          title="Eigene Zahlungsarten"
          description="Bleiben als Vorschlag erhalten, auch wenn kein Abo sie mehr nutzt. Noch benutzte erscheinen weiterhin."
        >
          <PaymentMethodManager />
        </FormSection>

        <FormSection
          title="Privatsphäre"
          description="Sichtschutz vor neugierigen Blicken. Die Daten selbst liegen unverschlüsselt im Browser-Speicher."
        >
          <AppLockSection />
        </FormSection>

        <FormSection
          id="backup-section"
          title="Datensicherung"
          description="Ein Backup enthält alle Abos inkl. Preisverlauf und Logos, Kategorien und Einstellungen. Mit «Dokumente mitsichern» kommen auch die Dokumente mit (als ZIP)."
        >
          <BackupSection onRestored={hydrate} />
        </FormSection>

        <p className="flex items-start gap-2 px-1 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          SubPulse speichert alles ausschliesslich lokal in diesem Browser. Aus dem Internet geladen werden nur die
          Wechselkurse – und Logos, wenn du die Logo-Suche nutzt.
        </p>
      </div>
    </Modal>
  );
}
