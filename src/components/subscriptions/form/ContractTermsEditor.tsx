import type { DraftValidation, SubscriptionDraft } from '../../../types';
import { NOTICE_UNIT_OPTIONS, RENEWAL_OPTIONS } from '../../../utils/options';
import { Collapse } from '../../ui/Collapse';
import { DateField } from '../../ui/DateField';
import { Select } from '../../ui/Select';
import { TextField } from '../../ui/TextField';
import { Toggle } from '../../ui/Toggle';

type ContractTermsPatch = Partial<
  Pick<
    SubscriptionDraft,
    | 'cancellationNoticeDays'
    | 'noticeUnit'
    | 'noticeToMonthEnd'
    | 'minimumCommitmentUntil'
    | 'renewalType'
    | 'renewalMonths'
  >
>;

interface ContractTermsEditorProps {
  draft: SubscriptionDraft;
  errors: DraftValidation['fields'];
  onChange: (patch: ContractTermsPatch) => void;
}

/**
 * Kündigungsfrist, Mindestlaufzeit und Anschlussregel – daraus rechnet das Kündigungsradar
 * den spätestmöglichen Kündigungstag und den nächsten Verlängerungsstichtag.
 */
export function ContractTermsEditor({ draft, errors, onChange }: ContractTermsEditorProps) {
  const fixed = draft.renewalType === 'fixed';

  return (
    <>
      <div className="grid grid-cols-2 items-start gap-3">
        <TextField
          label="Kündigungsfrist"
          inputMode="numeric"
          value={draft.cancellationNoticeDays}
          onChange={(event) => onChange({ cancellationNoticeDays: event.target.value })}
          error={errors.cancellationNoticeDays}
        />
        <Select
          label="Einheit"
          value={draft.noticeUnit}
          options={NOTICE_UNIT_OPTIONS}
          onChange={(noticeUnit) => onChange({ noticeUnit })}
        />
      </div>
      <Toggle
        label="Nur auf Monatsende kündbar"
        description="Z.B. «1 Monat auf Ende des Monats» bei Handy- oder Fitness-Verträgen."
        checked={draft.noticeToMonthEnd}
        onChange={(noticeToMonthEnd) => onChange({ noticeToMonthEnd })}
      />
      <DateField
        clearable
        placeholder="Keine"
        label="Mindestlaufzeit bis"
        hint="Optional – erst zum Ende dieser Bindung regulär kündbar (z.B. bei 12- oder 24-Monats-Verträgen)."
        min={draft.firstBillingDate}
        value={draft.minimumCommitmentUntil}
        onChange={(minimumCommitmentUntil) => onChange({ minimumCommitmentUntil })}
        error={errors.minimumCommitmentUntil}
      />
      <div>
        <Select
          label={draft.minimumCommitmentUntil ? 'Nach der Mindestlaufzeit' : 'Verlängerung'}
          value={draft.renewalType}
          options={RENEWAL_OPTIONS}
          onChange={(renewalType) => onChange({ renewalType })}
          hint={
            fixed
              ? 'Kündbar nur auf das Ende der jeweiligen Laufzeit – sonst läuft der Vertrag weiter.'
              : 'Die Kündigungsfrist gilt vor jeder Abbuchung.'
          }
        />
        <Collapse open={fixed}>
          <TextField
            label="Verlängert sich jeweils um"
            inputMode="numeric"
            hint="In Monaten, z.B. 12"
            value={draft.renewalMonths}
            onChange={(event) => onChange({ renewalMonths: event.target.value })}
            error={errors.renewalMonths}
          />
        </Collapse>
      </div>
    </>
  );
}
