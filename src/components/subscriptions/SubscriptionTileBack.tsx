import type { SubscriptionFacts } from '../../types';
import { formatDate } from '../../utils/format';

interface SubscriptionTileBackProps {
  facts: SubscriptionFacts;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full min-w-0">
      <dt className="truncate text-[10px] leading-3 font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="truncate text-xs leading-4 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** Rückseite der Kachel: nur das Wichtigste – nächste Abbuchung, Frist und Zahlungsart. */
export function SubscriptionTileBack({ facts }: SubscriptionTileBackProps) {
  return (
    <dl className="flex h-full flex-col items-center justify-center gap-1 px-2 py-2.5 text-center">
      <Fact label="Nächste" value={facts.nextCharge ? formatDate(facts.nextCharge.date) : '–'} />
      <Fact label="Kündigen bis" value={facts.cancelBy ? formatDate(facts.cancelBy) : 'Jederzeit'} />
      <Fact label="Zahlung" value={facts.paymentMethod || '–'} />
    </dl>
  );
}
