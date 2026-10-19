import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Dashboard } from './components/dashboard/Dashboard';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { MobileDock } from './components/layout/MobileDock';
import { SettingsModal } from './components/settings/SettingsModal';
import { StatisticsView } from './components/statistics/StatisticsView';
import { SubscriptionFormModal } from './components/subscriptions/form/SubscriptionFormModal';
import { FloatingActionButton } from './components/ui/FloatingActionButton';
import { db } from './db/database';
import { useApplyTheme } from './hooks/useApplyTheme';
import { isAppTab, tabPanelId, useNavigationStore } from './store/useNavigationStore';
import { useSettingsStore } from './store/useSettingsStore';
import type { Category, Subscription } from './types';
import { spring } from './utils/motion';

const NO_CATEGORIES: Category[] = [];

/** Richtungsabhängiger Tab-Wechsel: neuer Inhalt gleitet aus der Klickrichtung herein. */
const TAB_VARIANTS: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 40, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40, filter: 'blur(6px)' }),
};

export default function App() {
  const settings = useSettingsStore((s) => s.settings);
  const rates = useSettingsStore((s) => s.rates);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const refreshRates = useSettingsStore((s) => s.refreshRates);
  const activeTab = useNavigationStore((s) => s.activeTab);
  const direction = useNavigationStore((s) => s.direction);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  const subscriptions = useLiveQuery(() => db.subscriptions.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? NO_CATEGORIES;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const modalOpen = formOpen || settingsOpen;

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Nach einer Offline-Phase veraltete Kurse nachladen.
  useEffect(() => {
    const onOnline = () => void refreshRates();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refreshRates]);

  // Einstiegspunkte der PWA-Shortcuts (?action=new, ?tab=statistics) einmalig auswerten.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (isAppTab(tab)) setActiveTab(tab);
    if (params.get('action') === 'new') {
      setEditing(null);
      setFormOpen(true);
    }
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, [setActiveTab]);

  useApplyTheme(settings.theme);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (subscription: Subscription) => {
    setEditing(subscription);
    setFormOpen(true);
  };
  const changeTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeForm = useCallback(() => setFormOpen(false), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <AppShell>
      <Header
        theme={settings.theme}
        onThemeChange={(theme) => void setTheme(theme)}
        activeTab={activeTab}
        onTabChange={changeTab}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {subscriptions !== undefined && (
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.main
            key={activeTab}
            id={tabPanelId(activeTab)}
            role="tabpanel"
            custom={direction}
            variants={TAB_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ ...spring, opacity: { duration: 0.2 }, filter: { duration: 0.2 } }}
            className="flex flex-col gap-6"
          >
            {activeTab === 'overview' ? (
              <Dashboard
                subscriptions={subscriptions}
                categories={categories}
                baseCurrency={settings.baseCurrency}
                rates={rates}
                onCreate={openCreate}
                onSelect={openEdit}
              />
            ) : (
              <StatisticsView
                subscriptions={subscriptions}
                categories={categories}
                baseCurrency={settings.baseCurrency}
                rates={rates}
                onCreate={openCreate}
              />
            )}
          </motion.main>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {!modalOpen && <FloatingActionButton key="fab" icon={Plus} label="Abo hinzufügen" onClick={openCreate} />}
        {!modalOpen && <MobileDock key="dock" activeTab={activeTab} onTabChange={changeTab} onAdd={openCreate} />}
      </AnimatePresence>

      <SubscriptionFormModal
        open={formOpen}
        subscription={editing}
        categories={categories}
        baseCurrency={settings.baseCurrency}
        onClose={closeForm}
      />
      <SettingsModal open={settingsOpen} onClose={closeSettings} />
    </AppShell>
  );
}
