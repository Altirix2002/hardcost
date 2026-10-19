import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Dashboard } from './components/dashboard/Dashboard';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { MobileDock } from './components/layout/MobileDock';
import { FloatingActionButton } from './components/ui/FloatingActionButton';
import { db } from './db/database';
import { useApplyTheme } from './hooks/useApplyTheme';
import { isAppTab, tabPanelId, useNavigationStore } from './store/useNavigationStore';
import { useSettingsStore } from './store/useSettingsStore';
import type { Category, Subscription } from './types';
import { spring } from './utils/motion';
import { getPaymentMethodSuggestions } from './utils/options';

const NO_CATEGORIES: Category[] = [];
const NO_SUBSCRIPTIONS: Subscription[] = [];

// Code-Splitting: Modals und Statistiken landen in eigenen Chunks und werden erst bei Bedarf
// (bzw. kurz nach dem Start im Hintergrund) geladen – die Übersicht startet so schneller.
const loadFormModal = () => import('./components/subscriptions/form/SubscriptionFormModal');
const loadSettingsModal = () => import('./components/settings/SettingsModal');
const loadStatistics = () => import('./components/statistics/StatisticsView');
const loadUpcomingModal = () => import('./components/dashboard/UpcomingPaymentsModal');

const SubscriptionFormModal = lazy(() => loadFormModal().then((m) => ({ default: m.SubscriptionFormModal })));
const SettingsModal = lazy(() => loadSettingsModal().then((m) => ({ default: m.SettingsModal })));
const StatisticsView = lazy(() => loadStatistics().then((m) => ({ default: m.StatisticsView })));
const UpcomingPaymentsModal = lazy(() =>
  loadUpcomingModal().then((m) => ({ default: m.UpcomingPaymentsModal })),
);

const PRELOAD_DELAY_MS = 1500;

/**
 * Richtungsabhängiger Tab-Wechsel: neuer Inhalt gleitet aus der Klickrichtung herein.
 * Am Ende muss `filter` wieder ganz weg (nicht nur blur(0px)) – jeder Filter auf einem Vorfahren
 * schneidet den Glas-Karten darin den `backdrop-filter` auf den Hintergrund ab.
 */
const TAB_VARIANTS: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 40, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40, filter: 'blur(6px)' }),
};

/** Erst nach dem Ausblenden des alten Tabs nach oben springen – unsichtbar statt ruckelnd. */
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

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
  // Modals erst nach dem ersten Öffnen mounten (und damit laden), danach für Exit-Animationen behalten.
  const [formMounted, setFormMounted] = useState(false);
  const [settingsMounted, setSettingsMounted] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [upcomingMounted, setUpcomingMounted] = useState(false);
  const modalOpen = formOpen || settingsOpen || upcomingOpen;

  const paymentMethods = useMemo(
    () => getPaymentMethodSuggestions(subscriptions ?? NO_SUBSCRIPTIONS),
    [subscriptions],
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Ausgelagerte Chunks nach dem ersten Rendern vorladen, damit das erste Öffnen ohne Wartezeit klappt.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFormModal();
      void loadSettingsModal();
      void loadStatistics();
      void loadUpcomingModal();
    }, PRELOAD_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

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
      setFormMounted(true);
      setFormOpen(true);
    }
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, [setActiveTab]);

  useApplyTheme(settings.theme);

  const openCreate = () => {
    setEditing(null);
    setFormMounted(true);
    setFormOpen(true);
  };
  const openEdit = (subscription: Subscription) => {
    setEditing(subscription);
    setFormMounted(true);
    setFormOpen(true);
  };
  const openSettings = () => {
    setSettingsMounted(true);
    setSettingsOpen(true);
  };
  const openUpcoming = () => {
    setUpcomingMounted(true);
    setUpcomingOpen(true);
  };
  /** Aus der Abbuchungsliste direkt ins Abo: Liste schliessen, Formular öffnen. */
  const editFromUpcoming = (subscription: Subscription) => {
    setUpcomingOpen(false);
    openEdit(subscription);
  };
  const closeForm = useCallback(() => setFormOpen(false), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const closeUpcoming = useCallback(() => setUpcomingOpen(false), []);

  return (
    <AppShell>
      <Header
        theme={settings.theme}
        onThemeChange={(theme) => void setTheme(theme)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={openSettings}
      />

      {/*
        Mindesthöhe auf dem Handy: Würde die Seite beim Wechsel kurz kürzer als der Bildschirm,
        blendet Chrome seine Adressleiste schlagartig ein und das fixierte Dock springt.
      */}
      <div className="max-sm:min-h-lvh">
        {subscriptions !== undefined && (
          <AnimatePresence mode="wait" initial={false} custom={direction} onExitComplete={scrollToTop}>
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
                  onShowUpcoming={openUpcoming}
                />
              ) : (
                <Suspense fallback={null}>
                  <StatisticsView
                    subscriptions={subscriptions}
                    categories={categories}
                    baseCurrency={settings.baseCurrency}
                    rates={rates}
                    onCreate={openCreate}
                  />
                </Suspense>
              )}
            </motion.main>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {!modalOpen && <FloatingActionButton key="fab" icon={Plus} label="Abo hinzufügen" onClick={openCreate} />}
        {!modalOpen && <MobileDock key="dock" activeTab={activeTab} onTabChange={setActiveTab} onAdd={openCreate} />}
      </AnimatePresence>

      <Suspense fallback={null}>
        {formMounted && (
          <SubscriptionFormModal
            open={formOpen}
            subscription={editing}
            categories={categories}
            baseCurrency={settings.baseCurrency}
            paymentMethods={paymentMethods}
            onClose={closeForm}
          />
        )}
        {settingsMounted && <SettingsModal open={settingsOpen} onClose={closeSettings} />}
        {upcomingMounted && (
          <UpcomingPaymentsModal
            open={upcomingOpen}
            onClose={closeUpcoming}
            subscriptions={subscriptions ?? NO_SUBSCRIPTIONS}
            categories={categories}
            baseCurrency={settings.baseCurrency}
            rates={rates}
            onSelect={editFromUpcoming}
          />
        )}
      </Suspense>
    </AppShell>
  );
}
