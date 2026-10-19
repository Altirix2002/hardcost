import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Dashboard } from './components/dashboard/Dashboard';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { SubscriptionFormModal } from './components/subscriptions/form/SubscriptionFormModal';
import { FloatingActionButton } from './components/ui/FloatingActionButton';
import { db } from './db/database';
import { useApplyTheme } from './hooks/useApplyTheme';
import { useSettingsStore } from './store/useSettingsStore';
import type { Category, Subscription } from './types';

const NO_CATEGORIES: Category[] = [];

export default function App() {
  const settings = useSettingsStore((s) => s.settings);
  const rates = useSettingsStore((s) => s.rates);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const refreshRates = useSettingsStore((s) => s.refreshRates);

  const subscriptions = useLiveQuery(() => db.subscriptions.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? NO_CATEGORIES;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Nach einer Offline-Phase veraltete Kurse nachladen.
  useEffect(() => {
    const onOnline = () => void refreshRates();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refreshRates]);

  useApplyTheme(settings.theme);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (subscription: Subscription) => {
    setEditing(subscription);
    setFormOpen(true);
  };
  const closeForm = useCallback(() => setFormOpen(false), []);

  return (
    <AppShell>
      <Header theme={settings.theme} onThemeChange={(theme) => void setTheme(theme)} />

      {subscriptions !== undefined && (
        <Dashboard
          subscriptions={subscriptions}
          categories={categories}
          baseCurrency={settings.baseCurrency}
          rates={rates}
          onCreate={openCreate}
          onSelect={openEdit}
        />
      )}

      <AnimatePresence>
        {!formOpen && <FloatingActionButton icon={Plus} label="Abo hinzufügen" onClick={openCreate} />}
      </AnimatePresence>

      <SubscriptionFormModal
        open={formOpen}
        subscription={editing}
        categories={categories}
        baseCurrency={settings.baseCurrency}
        onClose={closeForm}
      />
    </AppShell>
  );
}
