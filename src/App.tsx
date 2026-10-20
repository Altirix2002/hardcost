import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Dashboard } from './components/dashboard/Dashboard';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { MobileDock } from './components/layout/MobileDock';
import { DynamicIsland } from './components/ui/DynamicIsland';
import { FloatingActionButton } from './components/ui/FloatingActionButton';
import { db } from './db/database';
import { useApplyTheme } from './hooks/useApplyTheme';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useTabSwipe } from './hooks/useTabSwipe';
import { isAppTab, tabPanelId, useNavigationStore } from './store/useNavigationStore';
import { useSettingsStore } from './store/useSettingsStore';
import type { Category, Subscription } from './types';
import { springWithFade } from './utils/motion';
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

/** Plus-Knopf und Erfassen-Fenster teilen sich diese layoutId (Morph, nur Desktop). */
const ADD_TRIGGER_LAYOUT_ID = 'subscription-trigger';

/**
 * Richtungsabhängiger Tab-Wechsel: neuer Inhalt gleitet aus der Klickrichtung herein.
 * Bewusst nur Transform und Deckkraft (GPU-freundlich) – ein animierter Blur-Filter über die
 * ganze Seite ruckelt auf dem Handy und schneidet den Glas-Karten den Hintergrund-Blur ab.
 */
const TAB_VARIANTS: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -32 }),
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
  // Auf dem Handy fährt das Sheet klassisch von unten herein (iOS-Verhalten); den FAB gibt es dort nicht.
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const addLayoutId = isDesktop ? ADD_TRIGGER_LAYOUT_ID : undefined;
  const tabSwipe = useTabSwipe();

  const paymentMethods = useMemo(
    () => getPaymentMethodSuggestions(subscriptions ?? NO_SUBSCRIPTIONS, settings.paymentMethods),
    [subscriptions, settings.paymentMethods],
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
      <div className="max-sm:min-h-lvh" {...tabSwipe}>
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
              transition={springWithFade}
              className="flex flex-col gap-6"
            >
              {activeTab === 'overview' ? (
                <Dashboard
                  subscriptions={subscriptions}
                  categories={categories}
                  baseCurrency={settings.baseCurrency}
                  rates={rates}
                  monthlyBudget={settings.monthlyBudget}
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
        {!modalOpen && <FloatingActionButton
            key="fab"
            icon={Plus}
            label="Abo hinzufügen"
            onClick={openCreate}
            layoutId={addLayoutId}
          />}
        {!modalOpen && <MobileDock key="dock" activeTab={activeTab} onTabChange={setActiveTab} onAdd={openCreate} />}
      </AnimatePresence>

      <DynamicIsland />

      <Suspense fallback={null}>
        {formMounted && (
          <SubscriptionFormModal
            open={formOpen}
            subscription={editing}
            categories={categories}
            baseCurrency={settings.baseCurrency}
            rates={rates}
            paymentMethods={paymentMethods}
            onClose={closeForm}
            layoutId={addLayoutId}
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
