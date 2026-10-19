import { AlertTriangle, CalendarRange, RefreshCw, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CostSummary, ExchangeRates } from '../../types';
import { cn } from '../../utils/cn';
import { parseISODate } from '../../utils/dates';
import { formatCurrency, formatDate } from '../../utils/format';
import { AnimatedCurrency } from '../ui/AnimatedCurrency';
import { GlassCard } from '../ui/GlassCard';

interface CostHeroProps {
  summary: CostSummary;
  baseCurrency: string;
  rates: ExchangeRates | null;
  /** Tatsächliche Abbuchungen im laufenden Monat (historientreu). */
  monthSpend: number;
  monthName: string;
}

interface HeroCardProps {
  label: string;
  icon: LucideIcon;
  value: number;
  currency: string;
  hint: string;
  glowClassName: string;
}

function HeroCard({ label, icon: Icon, value, currency, hint, glowClassName }: HeroCardProps) {
  return (
    <GlassCard className="relative overflow-hidden p-6">
      <div aria-hidden className={cn('pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full blur-3xl', glowClassName)} />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </div>
        <AnimatedCurrency
          key={currency}
          value={value}
          currency={currency}
          className="mt-3 block text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
        />
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
    </GlassCard>
  );
}

export function CostHero({ summary, baseCurrency, rates, monthSpend, monthName }: CostHeroProps) {
  const hasUnconverted = summary.unconvertedCurrencies.length > 0;

  return (
    <section aria-label="Gesamtkosten" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <HeroCard
          label="Pro Monat"
          icon={Wallet}
          value={summary.monthly}
          currency={baseCurrency}
          hint={`Abbuchungen im ${monthName}: ${formatCurrency(monthSpend, baseCurrency)}`}
          glowClassName="bg-sky-400/30 dark:bg-sky-500/20"
        />
        <HeroCard
          label="Pro Jahr"
          icon={CalendarRange}
          value={summary.yearly}
          currency={baseCurrency}
          hint={`≈ ${formatCurrency(summary.yearly / 365, baseCurrency)} pro Tag`}
          glowClassName="bg-violet-400/30 dark:bg-violet-500/20"
        />
      </div>
      <p
        className={cn(
          'flex items-center gap-1.5 px-1 text-xs',
          hasUnconverted ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400',
        )}
      >
        {hasUnconverted ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {summary.unconvertedCurrencies.join(', ')} ohne Wechselkurs – Beträge 1:1 gezählt, bis Kurse geladen sind.
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {rates
              ? `Fremdwährungen in ${baseCurrency} umgerechnet · EZB-Kurse vom ${formatDate(parseISODate(rates.date), true)}`
              : `Alle Beträge in ${baseCurrency}`}
          </>
        )}
      </p>
    </section>
  );
}
