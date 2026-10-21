import type { ReactNode } from 'react';
import type { SubscriptionFacts } from '../../types';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDate } from '../../utils/format';
import { PAYMENT_CARD_KIND_LABELS, formatCardExpiry } from '../../utils/paymentCards';

interface SubscriptionCardBackProps {
  name: string;
  facts: SubscriptionFacts;
  baseCurrency: string;
}

function Fact({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="truncate text-[11px] leading-4 font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="truncate text-sm leading-5 font-semibold tracking-tight tabular-nums">{children}</dd>
    </div>
  );
}

/** Rückseite der Listenkarte: Detail- und Vertragsdaten auf einen Blick (zweispaltig, kompakt). */
export function SubscriptionCardBack({ name, facts, baseCurrency }: SubscriptionCardBackProps) {
  const { nextCharge, cancelBy, boundUntil, renewsForMonths, card } = facts;
  const term = boundUntil
    ? `bis ${formatDate(boundUntil, true)}`
    : renewsForMonths
      ? `+${renewsForMonths} Mt. je Laufzeit`
      : 'Flexibel';

  return (
    <div className="flex h-full flex-col gap-2 px-4 py-3.5">
      <p className="card-back-title truncate text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {name} · Details
      </p>
      <dl className="grid flex-1 grid-cols-2 content-center gap-x-4 gap-y-2">
        <Fact label="Nächste Abbuchung">
          {nextCharge
            ? `${formatDate(nextCharge.date)} · ${formatCurrency(nextCharge.amount, nextCharge.currency)}`
            : '–'}
        </Fact>
        <Fact label="Kündigen bis" className={cancelBy ? 'text-amber-700 dark:text-amber-300' : undefined}>
          {cancelBy ? formatDate(cancelBy, true) : 'Jederzeit'}
        </Fact>
        <Fact label={boundUntil ? 'Gebunden' : 'Laufzeit'}>{term}</Fact>
        <Fact label="Zahlung">
          {facts.paymentMethod || '–'}
          {card?.lastFour && <span className="font-normal text-zinc-500 dark:text-zinc-400"> ·{card.lastFour}</span>}
        </Fact>
        <Fact label="Bisher bezahlt" className="card-back-extra">
          {formatCurrency(facts.paidTotal, baseCurrency)}
        </Fact>
        <Fact label={card?.expiresAt ? PAYMENT_CARD_KIND_LABELS[card.kind] : 'Kunde seit'} className="card-back-extra">
          {card?.expiresAt ? `gültig bis ${formatCardExpiry(card.expiresAt)}` : formatDate(facts.since, true)}
        </Fact>
      </dl>
    </div>
  );
}
