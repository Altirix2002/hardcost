import type { DraftValidation, SubscriptionDraft } from '../../../types';
import { Collapse } from '../../ui/Collapse';
import { DateField } from '../../ui/DateField';
import { Toggle } from '../../ui/Toggle';

type StatusPatch = Partial<Pick<SubscriptionDraft, 'isTrial' | 'trialEndsAt' | 'isCancelled' | 'endsOn'>>;

interface StatusEditorProps {
  draft: SubscriptionDraft;
  errors: DraftValidation['fields'];
  onChange: (patch: StatusPatch) => void;
}

/** Gratis-Testphase: bis zum letzten Gratis-Tag fällt nichts an, das Radar warnt vorher. */
export function TrialEditor({ draft, errors, onChange }: StatusEditorProps) {
  return (
    <div>
      <Toggle
        label="Gratis-Testphase"
        description="Bis zum Ende fällt nichts an – das Kündigungsradar warnt rechtzeitig."
        checked={draft.isTrial}
        onChange={(isTrial) => onChange({ isTrial })}
      />
      <Collapse open={draft.isTrial}>
        <DateField
          label="Gratis bis"
          hint="Letzter kostenloser Tag. Danach gilt der normale Preis."
          min={draft.firstBillingDate}
          value={draft.trialEndsAt}
          onChange={(trialEndsAt) => onChange({ trialEndsAt })}
          error={errors.trialEndsAt}
        />
      </Collapse>
    </div>
  );
}

/** Gekündigt: Das Abo läuft bis zum Enddatum weiter und zählt bis dahin mit. */
export function CancellationEditor({ draft, errors, onChange }: StatusEditorProps) {
  return (
    <div>
      <Toggle
        label="Gekündigt"
        description="Läuft bis zum Enddatum weiter und zählt bis dahin mit."
        checked={draft.isCancelled}
        onChange={(isCancelled) => onChange({ isCancelled })}
      />
      <Collapse open={draft.isCancelled}>
        <DateField
          clearable
          label="Läuft noch bis"
          placeholder="Bereits beendet"
          hint="Letzter Tag des Abos. Leer = schon beendet."
          value={draft.endsOn}
          onChange={(endsOn) => onChange({ endsOn })}
          error={errors.endsOn}
        />
      </Collapse>
    </div>
  );
}
