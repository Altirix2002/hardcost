import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, Copy, Trash2 } from 'lucide-react';
import { createCategory, saveSubscription } from '../../../db/repository';
import { withBrandColors } from '../../../utils/brandColors';
import { deleteWithUndo } from '../../../services/subscriptionActions';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { showToast } from '../../../store/useToastStore';
import type { Category, DraftValidation, ExchangeRates, Subscription, SubscriptionDraft } from '../../../types';
import { parseISODate } from '../../../utils/dates';
import { formatDate } from '../../../utils/format';
import { BILLING_CYCLE_OPTIONS, CURRENCY_OPTIONS } from '../../../utils/options';
import { getPauseAt } from '../../../utils/pauses';
import {
  addPriceChange,
  createEmptyDraft,
  draftToSubscription,
  duplicateDraft,
  removePriceInterval,
  setDraftCurrency,
  setFirstBillingDate,
  subscriptionToDraft,
  updatePriceInterval,
  validateDraft,
} from '../../../utils/subscriptionDraft';
import { Button } from '../../ui/Button';
import { DateField } from '../../ui/DateField';
import { FormSection } from '../../ui/FormSection';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { TextArea } from '../../ui/TextArea';
import { TextField } from '../../ui/TextField';
import { DocumentManager } from '../../documents/DocumentManager';
import { CategoryPicker } from './CategoryPicker';
import { LifetimeCostPanel } from './LifetimeCostPanel';
import { LogoPicker } from './LogoPicker';
import { PauseEditor } from './PauseEditor';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { PriceIntervalEditor } from './PriceIntervalEditor';
import { SplitEditor } from './SplitEditor';
import { CancellationEditor, TrialEditor } from './StatusEditors';
import { ContractTermsEditor } from './ContractTermsEditor';

interface SubscriptionFormModalProps {
  open: boolean;
  /** null = neues Abo erfassen */
  subscription: Subscription | null;
  categories: Category[];
  baseCurrency: string;
  rates: ExchangeRates | null;
  /** Vorschläge für die Zahlungsart, inkl. selbst eingetragener. */
  paymentMethods: string[];
  onClose: () => void;
  /** Morph-Quelle (Plus-Knopf), nur beim Erfassen auf dem Desktop. */
  layoutId?: string;
}

const NO_ERRORS: DraftValidation = { isValid: true, fields: {}, intervals: {} };

/** Text der Bestätigung nach dem Speichern, z.B. "Netflix bis 1. Nov. pausiert". */
function describeSave(sub: Subscription, isEditing: boolean): string {
  if (sub.endsOn) return `${sub.name} gekündigt – läuft bis ${formatDate(parseISODate(sub.endsOn))}`;
  const pause = getPauseAt(sub, new Date());
  if (pause) return pause.endDate ? `${sub.name} bis ${formatDate(parseISODate(pause.endDate))} pausiert` : `${sub.name} pausiert`;
  return isEditing ? `${sub.name} gespeichert` : `${sub.name} hinzugefügt`;
}

export function SubscriptionFormModal({
  open,
  subscription,
  categories,
  baseCurrency,
  rates,
  paymentMethods,
  onClose,
  layoutId,
}: SubscriptionFormModalProps) {
  const formId = useId();
  const rememberPaymentMethod = useSettingsStore((s) => s.rememberPaymentMethod);
  // Nach "Duplizieren" ist der Entwurf ein neues Abo, auch wenn das Fenster vom Original kommt.
  const [isCopy, setIsCopy] = useState(false);
  const isEditing = subscription !== null && !isCopy;
  const formRef = useRef<HTMLFormElement>(null);

  const buildDraft = () =>
    subscription ? subscriptionToDraft(subscription, baseCurrency) : createEmptyDraft(baseCurrency);

  const [draft, setDraft] = useState<SubscriptionDraft>(buildDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Bei jedem Öffnen frisch starten; das Modal bleibt für die Exit-Animation gemountet.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(buildDraft());
      setShowErrors(false);
      setConfirmDelete(false);
      setIsCopy(false);
      setSaving(false);
      setSaveError(null);
    }
  }

  const validation = useMemo(() => validateDraft(draft), [draft]);
  const errors = showErrors ? validation : NO_ERRORS;
  const selectedCategory = categories.find((c) => c.id === draft.categoryId);

  const update = <K extends keyof SubscriptionDraft>(key: K, value: SubscriptionDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const patch = (changes: Partial<SubscriptionDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!validation.isValid) {
      setShowErrors(true);
      return;
    }
    // Offene Handy-Tastatur zuerst schliessen: Fährt sie während der Schliess-Animation ein,
    // konnte das Sheet mit ausgegrautem Button stehen bleiben.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setSaving(true);
    setSaveError(null);
    let saved: Subscription;
    try {
      // Markenfarben einmal beim Speichern bestimmen (nur bei neuem Logo).
      saved = await withBrandColors(draftToSubscription(draft), subscription ?? undefined);
      await saveSubscription(saved);
      await rememberPaymentMethod(saved.paymentMethod);
    } catch {
      setSaving(false);
      setSaveError('Speichern fehlgeschlagen – bitte nochmals versuchen.');
      return;
    }
    // Erst zurücksetzen, dann schliessen: Das Sheet friert beim Ausblenden seinen letzten Zustand ein.
    setSaving(false);
    onClose();
    showToast('success', describeSave(saved, isEditing));
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onClose();
    if (subscription) await deleteWithUndo(subscription);
  };

  const handleDuplicate = () => {
    setDraft((current) => duplicateDraft(current));
    setIsCopy(true);
    setShowErrors(false);
    setConfirmDelete(false);
    formRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('info', 'Kopie erstellt – anpassen und hinzufügen');
  };

  const footer = (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {showErrors && !validation.isValid && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 overflow-hidden px-1 text-sm text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            Bitte prüfe die markierten Felder.
          </motion.p>
        )}
        {saveError && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 overflow-hidden px-1 text-sm text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {saveError}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        {isEditing && (
          <Button variant={confirmDelete ? 'danger' : 'ghost'} icon={Trash2} onClick={() => void handleDelete()}>
            {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
          </Button>
        )}
        {isEditing && !confirmDelete && (
          <Button variant="ghost" icon={Copy} onClick={handleDuplicate}>
            Kopieren
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={onClose} className="hidden sm:inline-flex">
            Abbrechen
          </Button>
          <Button type="submit" form={formId} icon={Check} disabled={saving}>
            {isEditing ? 'Sichern' : 'Hinzufügen'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Abo bearbeiten' : 'Neues Abo'}
      footer={footer}
      layoutId={subscription ? undefined : layoutId}
    >
      <form ref={formRef} id={formId} noValidate onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-8">
        {isEditing && subscription && <LifetimeCostPanel subscription={subscription} baseCurrency={baseCurrency} rates={rates} />}

        <FormSection title="Allgemein">
          <LogoPicker
            name={draft.name}
            logoUrl={draft.logoUrl}
            shape={draft.logoShape}
            color={selectedCategory?.color}
            onLogoChange={(logoUrl) => update('logoUrl', logoUrl)}
            onShapeChange={(logoShape) => update('logoShape', logoShape)}
          />
          <TextField
            label="Name"
            placeholder="z.B. Netflix"
            autoComplete="off"
            value={draft.name}
            onChange={(event) => update('name', event.target.value)}
            error={errors.fields.name}
          />
          <TextField
            label="Tarif"
            placeholder="z.B. Family 4K"
            hint="Optional"
            autoComplete="off"
            value={draft.planName}
            onChange={(event) => update('planName', event.target.value)}
          />
        </FormSection>

        <FormSection title="Kategorie">
          <CategoryPicker
            categories={categories}
            value={draft.categoryId}
            onChange={(categoryId) => update('categoryId', categoryId)}
            onCreate={createCategory}
            error={errors.fields.categoryId}
          />
        </FormSection>

        <FormSection title="Abrechnung">
          <div className="grid grid-cols-2 items-start gap-3">
            <Select
              label="Zyklus"
              value={draft.billingCycle}
              options={BILLING_CYCLE_OPTIONS}
              onChange={(billingCycle) => update('billingCycle', billingCycle)}
            />
            <Select
              label="Währung"
              value={draft.currency}
              options={CURRENCY_OPTIONS}
              onChange={(currency) => setDraft((current) => setDraftCurrency(current, currency))}
            />
            <div className="col-span-2">
              <DateField
                label="Erste Abbuchung"
                value={draft.firstBillingDate}
                onChange={(date) => setDraft((current) => setFirstBillingDate(current, date))}
                error={errors.fields.firstBillingDate}
              />
            </div>
          </div>
          <ContractTermsEditor draft={draft} errors={errors.fields} onChange={patch} />
          <PaymentMethodPicker
            value={draft.paymentMethod}
            suggestions={paymentMethods}
            onChange={(paymentMethod) => update('paymentMethod', paymentMethod)}
          />
        </FormSection>

        <FormSection
          title="Preisverlauf"
          description="Eine Preisänderung beendet den bisherigen Preis – vergangene Monate bleiben unverändert."
        >
          <PriceIntervalEditor
            intervals={draft.intervals}
            errors={errors.intervals}
            onChange={(id, patch) => setDraft((current) => updatePriceInterval(current, id, patch))}
            onAdd={() => setDraft((current) => addPriceChange(current))}
            onRemove={(id) => setDraft((current) => removePriceInterval(current, id))}
          />
        </FormSection>

        <FormSection title="Status & Teilen">
          <TrialEditor draft={draft} errors={errors.fields} onChange={patch} />
          <SplitEditor draft={draft} errors={errors.fields} onChange={patch} />
          {!draft.isCancelled && <PauseEditor draft={draft} errors={errors.fields} onChange={patch} />}
          <CancellationEditor draft={draft} errors={errors.fields} onChange={patch} />
        </FormSection>

        <FormSection
          title="Dokumente"
          description={
            isEditing
              ? 'Verträge, Rechnungen oder Kündigungsbestätigungen (PDF, JPG, PNG bis 5 MB) – nur auf diesem Gerät gespeichert.'
              : 'Nach dem ersten Speichern kannst du hier Verträge und Belege ablegen.'
          }
        >
          {isEditing && <DocumentManager subscriptionId={draft.id} />}
        </FormSection>

        <FormSection title="Weiteres">
          <TextArea
            label="Notizen"
            placeholder="z.B. Login-Konto, geteilt mit …"
            value={draft.notes}
            onChange={(event) => update('notes', event.target.value)}
          />
        </FormSection>
      </form>
    </Modal>
  );
}
