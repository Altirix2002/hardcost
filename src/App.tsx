import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { SummaryGrid } from './components/dashboard/SummaryGrid';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { SubscriptionFormModal } from './components/subscriptions/form/SubscriptionFormModal';
import { SubscriptionList } from './components/subscriptions/SubscriptionList';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { FloatingActionButton } from './components/ui/FloatingActionButton';
import { db } from './db/database';
import { loadDemoSubscriptions } from './db/repository';
import { useApplyTheme } from './hooks/useApplyTheme';
import { useSettingsStore } from './store/useSettingsStore';
import type { Category, Subscription } from './types';
import { getNextBillingDate } from './utils/calculations';

/** Aktive Abos zuerst, danach nach nächster Abbuchung. */
function sortSubscriptions(subscriptions: Subscription[]): Subscription[] {
  const today = new Date();
  return [...subscriptions].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return getNextBillingDate(a, today).getTime() - getNextBillingDate(b, today).getTime();
  });
}

export default function App() {
  const settings = useSettingsStore((s) => s.settings);
  const rates = useSettingsStore((s) => s.rates);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const subscriptions = useLiveQuery(() => db.subscriptions.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useApplyTheme(settings.theme);

  const categoryList = useMemo(() => categories ?? [], [categories]);
  const categoriesById = useMemo(
    () => new Map<string, Category>(categoryList.map((c) => [c.id, c])),
    [categoryList],
  );
  const sorted = useMemo(() => sortSubscriptions(subscriptions ?? []), [subscriptions]);

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
        <>
          <SummaryGrid subscriptions={sorted} baseCurrency={settings.baseCurrency} rates={rates} />

          <section className="flex flex-col gap-3">
            <h2 className="px-1 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Deine Abos
            </h2>
            {sorted.length > 0 ? (
              <SubscriptionList
                subscriptions={sorted}
                categoriesById={categoriesById}
                baseCurrency={settings.baseCurrency}
                rates={rates}
                onSelect={openEdit}
              />
            ) : (
              <EmptyState
                icon={Sparkles}
                title="Noch keine Abos erfasst"
                description="Alle Daten bleiben lokal auf deinem Gerät. Erfasse dein erstes Abo oder lade Beispiele zum Ausprobieren."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button icon={Plus} onClick={openCreate}>
                      Erstes Abo erfassen
                    </Button>
                    <Button variant="secondary" onClick={() => void loadDemoSubscriptions()}>
                      Beispiele laden
                    </Button>
                  </div>
                }
              />
            )}
          </section>
        </>
      )}

      <AnimatePresence>
        {!formOpen && <FloatingActionButton icon={Plus} label="Abo hinzufügen" onClick={openCreate} />}
      </AnimatePresence>

      <SubscriptionFormModal
        open={formOpen}
        subscription={editing}
        categories={categoryList}
        baseCurrency={settings.baseCurrency}
        onClose={closeForm}
      />
    </AppShell>
  );
}
