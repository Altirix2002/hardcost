import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { DraftValidation, PriceIntervalDraft, PriceIntervalPatch } from '../../../types';
import { spring } from '../../../utils/motion';
import { Button } from '../../ui/Button';
import { PriceIntervalRow } from './PriceIntervalRow';

interface PriceIntervalEditorProps {
  intervals: PriceIntervalDraft[];
  errors: DraftValidation['intervals'];
  onChange: (id: string, patch: PriceIntervalPatch) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function PriceIntervalEditor({ intervals, errors, onChange, onAdd, onRemove }: PriceIntervalEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {intervals.map((interval) => (
            <motion.li
              key={interval.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={spring}
            >
              <PriceIntervalRow
                interval={interval}
                errors={errors[interval.id]}
                canRemove={intervals.length > 1}
                onChange={(patch) => onChange(interval.id, patch)}
                onRemove={() => onRemove(interval.id)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <motion.div layout transition={spring}>
        <Button variant="secondary" icon={Plus} onClick={onAdd} className="w-full">
          Preisänderung erfassen
        </Button>
      </motion.div>
    </div>
  );
}
