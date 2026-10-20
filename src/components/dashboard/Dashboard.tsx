import { useDeferredValue, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, RotateCcw, SearchX, Sparkles } from 'lucide-react';
import { loadDemoSubscriptions } from '../../db/repository';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { Category, ExchangeRates, Subscription } from '../../types';
import { getCancellationAlerts, getCostSummary, getSpendForMonth, getUpcomingPayments } from '../../utils/calculations';
import { formatMonthName } from '../../utils/format';
import { crossfadeVariants, swapVariants } from '../../utils/motion';
import { filterSubscriptions, searchSubscriptions, sortSubscriptions } from '../../utils/subscriptionList';
import { SubscriptionList } from '../subscriptions/SubscriptionList';
import { SubscriptionTileGrid } from '../subscriptions/SubscriptionTileGrid';
import { AutoHeight } from '../ui/AutoHeight';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { BackupReminder } from './BackupReminder';
import { CancellationRadar } from './CancellationRadar';
import { CostHero } from './CostHero';
import { SubscriptionSearch } from './SubscriptionSearch';
import { SubscriptionToolbar } from './SubscriptionToolbar';
import { UpcomingStats } from './UpcomingStats';

interface DashboardProps {
  subscriptions: Subscription[];
  categories: Category[];
  baseCurrency: string;
  rates: ExchangeRates | null;
  monthlyBudget?: number;
  lastBackupAt?: string;
  onOpenBackup: () => void;
  onCreate: () => void;
  onSelect: (subscription: Subscription) => void;
  onShowUpcoming: () => void;
}

export function Dashboard({
  subscriptions,
  categories,
  baseCurrency,
  rates,
  monthlyBudget,
  lastBackupAt,
  onOpenBackup,
  onCreate,
  onSelect,
  onShowUpcoming,
}: DashboardProps) {
  const sortKey = useDashboardStore((s) => s.sortKey);
  const statusFilter = useDashboardStore((s) => s.statusFilter);
  const setSortKey = useDashboardStore((s) => s.setSortKey);
  const setStatusFilter = useDashboardStore((s) => s.setStatusFilter);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
  const resetFilters = useDashboardStore((s) => s.resetFilters);
  // Eingabe bleibt sofort flüssig; die Liste filtert mit niedriger Priorität hinterher.
  const deferredQuery = useDeferredValue(searchQuery);
  const isSearching = deferredQuery.trim() !== '';

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const overview = useMemo(() => {
    const today = new Date();
    return {
      summary: getCostSummary(subscriptions, baseCurrency, rates, today),
      alerts: getCancellationAlerts(subscriptions, today),
      nextPayment: getUpcomingPayments(subscriptions, baseCurrency, rates, today, 1)[0],
      monthSpend: getSpendForMonth(subscriptions, today.getFullYear(), today.getMonth(), baseCurrency, rates),
      monthName: formatMonthName(today),
    };
  }, [subscriptions, baseCurrency, rates]);

  const visible = useMemo(
    () =>
      sortSubscriptions(
        searchSubscriptions(filterSubscriptions(subscriptions, statusFilter), deferredQuery, categoriesById),
        sortKey,
        baseCurrency,
        rates,
      ),
    [subscriptions, statusFilter, deferredQuery, categoriesById, sortKey, baseCurrency, rates],
  );

  return (
    <>
      <CostHero
        summary={overview.summary}
        baseCurrency={baseCurrency}
        rates={rates}
        monthSpend={overview.monthSpend}
        monthName={overview.monthName}
        alert={overview.alerts.length > 0}
        monthlyBudget={monthlyBudget}
      />
      <UpcomingStats
        summary={overview.summary}
        nextPayment={overview.nextPayment}
        baseCurrency={baseCurrency}
        onShowAll={onShowUpcoming}
      />
      <CancellationRadar alerts={overview.alerts} categoriesById={categoriesById} onSelect={onSelect} />
      <BackupReminder lastBackupAt={lastBackupAt} subscriptionCount={subscriptions.length} onBackup={onOpenBackup} />

      {/* Wechsel zwischen Liste und Leer-Zustand: das eine klappt zu, das andere gleichzeitig auf –
          so bleibt die Seitenhöhe fliessend (siehe collapseItemVariants). */}
      {/* Keine Scroll-Anker in der Abo-Liste: Karten/Kacheln stehen im Layout sofort am neuen Platz und
          gleiten nur optisch dorthin – Chrome würde auf den Layout-Platz "korrigieren" und die Seite springen lassen. */}
      <section className="[overflow-anchor:none]">
        <AnimatePresence initial={false}>
          {subscriptions.length === 0 ? (
            <motion.div key="empty" variants={swapVariants} initial="hidden" animate="visible" exit="exit">
              <EmptyState
                icon={Sparkles}
                title="Noch keine Abos erfasst"
                description="Alle Daten bleiben lokal auf deinem Gerät. Erfasse dein erstes Abo oder lade Beispiele zum Ausprobieren."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button icon={Plus} onClick={onCreate}>
                      Erstes Abo erfassen
                    </Button>
                    <Button variant="secondary" onClick={() => void loadDemoSubscriptions()}>
                      Beispiele laden
                    </Button>
                  </div>
                }
              />
            </motion.div>
          ) : (
            <motion.div key="list" variants={swapVariants} initial="hidden" animate="visible" exit="exit">
              {/* Kein gap um die Treffer: Beim Wechsel Treffer ↔ "Keine Treffer" sind kurz beide da –
                  ein gap käme dabei sprunghaft dazu bzw. fiele weg. */}
              <div>
                <div className="flex flex-col gap-3 pb-3">
                  <SubscriptionToolbar
                    count={visible.length}
                    sortKey={sortKey}
                    onSortChange={setSortKey}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                  <SubscriptionSearch value={searchQuery} onChange={setSearchQuery} />
                </div>
                <AnimatePresence initial={false}>
                  {visible.length > 0 ? (
                    <motion.div key="results" variants={swapVariants} initial="hidden" animate="visible" exit="exit">
                      {/* Ansicht wechseln: an Ort und Stelle überblenden, die Höhe gleitet mit (kein Wegschieben). */}
                      <AutoHeight className="-mx-2 -mt-2" innerClassName="relative px-2 pt-2">
                        <AnimatePresence initial={false} mode="popLayout">
                          <motion.div
                            key={viewMode}
                            variants={crossfadeVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {viewMode === 'tiles' ? (
                              <SubscriptionTileGrid
                                subscriptions={visible}
                                categoriesById={categoriesById}
                                baseCurrency={baseCurrency}
                                rates={rates}
                                onSelect={onSelect}
                              />
                            ) : (
                              <SubscriptionList
                                subscriptions={visible}
                                categoriesById={categoriesById}
                                baseCurrency={baseCurrency}
                                rates={rates}
                                onSelect={onSelect}
                              />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </AutoHeight>
                    </motion.div>
                  ) : (
                    <motion.div key="no-results" variants={swapVariants} initial="hidden" animate="visible" exit="exit">
                      <EmptyState
                        icon={SearchX}
                        title={
                          isSearching ? `Keine Treffer für «${deferredQuery.trim()}»` : 'Keine Abos in dieser Ansicht'
                        }
                        description={
                          isSearching
                            ? 'Gesucht wird in Name, Tarif, Kategorie, Zahlungsart und Notizen.'
                            : 'Wähle oben einen anderen Filter, um alle Abos zu sehen.'
                        }
                        action={
                          <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
                            Filter zurücksetzen
                          </Button>
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}
