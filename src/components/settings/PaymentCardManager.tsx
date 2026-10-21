import { useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { db } from '../../db/database';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { PaymentCard, PaymentCardKind } from '../../types';
import { cn } from '../../utils/cn';
import { daysBetween } from '../../utils/dates';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { sheetSpringWithFade } from '../../utils/motion';
import { getPaymentMethodSuggestions, normalizePaymentMethod } from '../../utils/options';
import {
  CARD_EXPIRY_ALERT_DAYS,
  PAYMENT_CARD_KIND_LABELS,
  PAYMENT_CARD_KIND_OPTIONS,
  formatCardExpiry,
  getCardExpiryDate,
  parseCardExpiry,
} from '../../utils/paymentCards';
import { PaymentMethodPicker } from '../subscriptions/form/PaymentMethodPicker';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { TextField } from '../ui/TextField';

interface CardEditorProps {
  card?: PaymentCard;
  suggestions: string[];
  /** Zahlungsarten, die schon eine Karte haben (ausser der bearbeiteten). */
  taken: Set<string>;
  onSave: (card: PaymentCard) => void;
  onDelete?: () => void;
  onDone: () => void;
}

function CardEditor({ card, suggestions, taken, onSave, onDelete, onDone }: CardEditorProps) {
  const [method, setMethod] = useState(card?.method ?? '');
  const [kind, setKind] = useState<PaymentCardKind>(card?.kind ?? 'standard');
  const [expiry, setExpiry] = useState(card?.expiresAt ? formatCardExpiry(card.expiresAt) : '');
  const [lastFour, setLastFour] = useState(card?.lastFour ?? '');

  const expiresAt = expiry.trim() === '' ? undefined : parseCardExpiry(expiry);
  const errors = {
    method: taken.has(normalizePaymentMethod(method)) ? 'Für diese Zahlungsart gibt es schon eine Karte.' : undefined,
    expiry: expiresAt === null ? 'Monat/Jahr, z.B. 08/27.' : undefined,
    lastFour: lastFour !== '' && !/^\d{4}$/.test(lastFour) ? 'Genau 4 Ziffern – oder leer lassen.' : undefined,
  };
  const valid = method.trim() !== '' && !errors.method && !errors.expiry && !errors.lastFour;

  const save = () => {
    if (!valid) return;
    onSave({
      method: method.trim(),
      kind,
      expiresAt: expiresAt ?? undefined,
      lastFour: lastFour === '' ? undefined : lastFour,
    });
    onDone();
  };

  return (
    <div className={cn(INSET_PANEL, 'mt-2 flex flex-col gap-4')}>
      <PaymentMethodPicker value={method} suggestions={suggestions} onChange={setMethod} />
      {errors.method && <p className="-mt-2 px-1 text-xs text-rose-600 dark:text-rose-400">{errors.method}</p>}
      <Select
        label="Kartentyp"
        value={kind}
        options={PAYMENT_CARD_KIND_OPTIONS}
        onChange={setKind}
        hint={
          kind === 'single-use'
            ? 'Nach einer Zahlung verbraucht – das Radar warnt vor jeder Verlängerung.'
            : kind === 'virtual'
              ? 'Das Radar warnt vor jeder Abbuchung (z.B. zum Aufladen) und vor dem Ablauf.'
              : `Das Radar warnt ${CARD_EXPIRY_ALERT_DAYS} Tage vor dem Ablauf.`
        }
      />
      <div className="grid grid-cols-2 items-start gap-3">
        <TextField
          label="Gültig bis"
          placeholder="MM/JJ"
          inputMode="numeric"
          autoComplete="off"
          value={expiry}
          onChange={(event) => setExpiry(event.target.value)}
          error={errors.expiry}
        />
        <TextField
          label="Letzte 4 Ziffern"
          placeholder="Optional"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={lastFour}
          onChange={(event) => setLastFour(event.target.value.replace(/\D/g, ''))}
          error={errors.lastFour}
        />
      </div>
      <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">
        Gespeichert wird nie die Kartennummer – nur Ablaufdatum und auf Wunsch die letzten 4 Ziffern.
      </p>

      <div className="flex items-center gap-2">
        {onDelete && (
          <Button size="sm" variant="ghost" icon={Trash2} onClick={onDelete}>
            Entfernen
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDone}>
            Abbrechen
          </Button>
          <Button size="sm" icon={card ? Check : Plus} disabled={!valid} onClick={save}>
            {card ? 'Sichern' : 'Hinzufügen'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={sheetSpringWithFade}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Ablaufdatum und Kartentyp je Zahlungsart – Grundlage des Karten-Radars. */
export function PaymentCardManager() {
  const cards = useSettingsStore((s) => s.settings.paymentCards) ?? [];
  const saved = useSettingsStore((s) => s.settings.paymentMethods);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const subscriptions = useLiveQuery(() => db.subscriptions.toArray(), []);
  const [editing, setEditing] = useState<number | 'new' | null>(null);

  const suggestions = useMemo(() => getPaymentMethodSuggestions(subscriptions ?? [], saved), [subscriptions, saved]);
  const today = new Date();

  const takenExcept = (index: number | null) =>
    new Set(cards.filter((_, i) => i !== index).map((card) => normalizePaymentMethod(card.method)));
  const save = (index: number | null, card: PaymentCard) =>
    void updateSettings({
      paymentCards: index === null ? [...cards, card] : cards.map((existing, i) => (i === index ? card : existing)),
    });
  const remove = (index: number) => {
    setEditing(null);
    const remaining = cards.filter((_, i) => i !== index);
    void updateSettings({ paymentCards: remaining.length ? remaining : undefined });
  };
  const toggle = (target: number | 'new') => setEditing((current) => (current === target ? null : target));

  return (
    <div className="flex flex-col gap-2">
      {cards.length > 0 && (
        <ul className="flex flex-col gap-2">
          {cards.map((card, index) => {
            const expiry = getCardExpiryDate(card);
            const daysLeft = expiry ? daysBetween(today, expiry) : null;
            const open = editing === index;
            return (
              <li key={normalizePaymentMethod(card.method)}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggle(index)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5 text-left transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80"
                >
                  <CreditCard className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{card.method}</span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {PAYMENT_CARD_KIND_LABELS[card.kind]}
                      {card.lastFour && ` · •••• ${card.lastFour}`}
                    </span>
                  </span>
                  {card.expiresAt && (
                    <span
                      className={cn(
                        'shrink-0 text-xs font-medium tabular-nums',
                        daysLeft !== null && daysLeft < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : daysLeft !== null && daysLeft <= CARD_EXPIRY_ALERT_DAYS
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-zinc-500 dark:text-zinc-400',
                      )}
                    >
                      {daysLeft !== null && daysLeft < 0 ? 'abgelaufen' : `bis ${formatCardExpiry(card.expiresAt)}`}
                    </span>
                  )}
                  <Pencil className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                </button>
                <Collapsible open={open}>
                  <CardEditor
                    card={card}
                    suggestions={suggestions}
                    taken={takenExcept(index)}
                    onSave={(updated) => save(index, updated)}
                    onDelete={() => remove(index)}
                    onDone={() => setEditing(null)}
                  />
                </Collapsible>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        variant="secondary"
        icon={Plus}
        aria-expanded={editing === 'new'}
        onClick={() => toggle('new')}
        className="w-full"
      >
        Karte hinzufügen
      </Button>
      <Collapsible open={editing === 'new'}>
        <CardEditor
          suggestions={suggestions}
          taken={takenExcept(null)}
          onSave={(card) => save(null, card)}
          onDone={() => setEditing(null)}
        />
      </Collapsible>
    </div>
  );
}
