import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles } from 'lucide-react';
import { SummaryGrid } from './components/dashboard/SummaryGrid';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { SubscriptionList } from './components/subscriptions/SubscriptionList';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { db } from './db/database';
import { DEMO_SUBSCRIPTIONS } from './db/seed';
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

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useApplyTheme(settings.theme);

  const categoriesById = useMemo(
    () => new Map<string, Category>((categories ?? []).map((c) => [c.id, c])),
    [categories],
  );
  const sorted = useMemo(() => sortSubscriptions(subscriptions ?? []), [subscriptions]);

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
              />
            ) : (
              <EmptyState
                icon={Sparkles}
                title="Noch keine Abos erfasst"
                description="Alle Daten bleiben lokal auf deinem Gerät. Lade Beispiel-Abos, um die Oberfläche auszuprobieren."
                action={
                  <Button variant="primary" onClick={() => void db.subscriptions.bulkPut(DEMO_SUBSCRIPTIONS)}>
                    Beispiel-Abos laden
                  </Button>
                }
              />
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
