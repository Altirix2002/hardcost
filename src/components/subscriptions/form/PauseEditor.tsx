import type { DraftValidation, SubscriptionDraft } from '../../../types';
import { toISODate } from '../../../utils/dates';
import { Collapse } from '../../ui/Collapse';
import { DateField } from '../../ui/DateField';
import { Toggle } from '../../ui/Toggle';

type PausePatch = Partial<Pick<SubscriptionDraft, 'isPaused' | 'pausedUntil'>>;

interface PauseEditorProps {
  draft: SubscriptionDraft;
  errors: DraftValidation['fields'];
  onChange: (patch: PausePatch) => void;
}

/** Schlummer-Modus: Abbuchungen während der Pause entfallen, danach läuft das Abo automatisch weiter. */
export function PauseEditor({ draft, errors, onChange }: PauseEditorProps) {
  return (
    <div>
      <Toggle
        label="Abo pausieren"
        description="Schlummer-Modus – zählt nicht zu den laufenden Kosten."
        checked={draft.isPaused}
        onChange={(isPaused) => onChange({ isPaused })}
      />
      <Collapse open={draft.isPaused}>
        <DateField
          clearable
          label="Pausiert bis"
          hint="Optional – danach läuft das Abo automatisch weiter. Leer = bis du es wieder aktivierst."
          min={toISODate(new Date())}
          value={draft.pausedUntil}
          placeholder="Unbefristet"
          onChange={(pausedUntil) => onChange({ pausedUntil })}
          error={errors.pausedUntil}
        />
      </Collapse>
    </div>
  );
}
