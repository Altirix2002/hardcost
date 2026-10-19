import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import type { Category, CategoryColor } from '../../../types';
import { sortCategories } from '../../../utils/categories';
import { getCategoryColorClasses } from '../../../utils/categoryStyles';
import { cn } from '../../../utils/cn';
import { INSET_PANEL } from '../../../utils/fieldStyles';
import { sheetSpringWithFade, spring } from '../../../utils/motion';
import { Button } from '../../ui/Button';
import { ColorSwatchPicker } from '../../ui/ColorSwatchPicker';
import { FieldMessage } from '../../ui/FieldMessage';
import { TextField } from '../../ui/TextField';

interface CategoryPickerProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  onCreate: (name: string, color: CategoryColor) => Promise<Category>;
  error?: string;
}

const CHIP_BASE = 'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors';
const CHIP_IDLE =
  'border-zinc-900/10 bg-white/50 text-zinc-700 hover:bg-white/80 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800/80';

export function CategoryPicker({ categories, value, onChange, onCreate, error }: CategoryPickerProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<CategoryColor>('sky');
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => sortCategories(categories), [categories]);

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const category = await onCreate(name, color);
      onChange(category.id);
      setName('');
      setCreating(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Kategorie" className="flex flex-wrap gap-2">
        {sorted.map((category) => {
          const selected = category.id === value;
          const classes = getCategoryColorClasses(category.color);
          return (
            <motion.button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category.id)}
              whileTap={{ scale: 0.94 }}
              transition={spring}
              className={cn(CHIP_BASE, selected ? cn('border-transparent', classes.soft) : CHIP_IDLE)}
            >
              <span className={cn('h-2.5 w-2.5 rounded-full', classes.solid)} aria-hidden />
              {category.name}
              {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          aria-expanded={creating}
          onClick={() => setCreating((open) => !open)}
          whileTap={{ scale: 0.94 }}
          transition={spring}
          className={cn(CHIP_BASE, CHIP_IDLE, 'border-dashed')}
        >
          <motion.span animate={{ rotate: creating ? 45 : 0 }} transition={spring} className="flex">
            <Plus className="h-4 w-4" aria-hidden />
          </motion.span>
          Eigene
        </motion.button>
      </div>

      <FieldMessage error={error} />

      <AnimatePresence initial={false}>
        {creating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={sheetSpringWithFade}
            className="overflow-hidden"
          >
            <div className={cn(INSET_PANEL, 'flex flex-col gap-4')}>
              <TextField
                label="Name der Kategorie"
                placeholder="z.B. Haushalt"
                value={name}
                maxLength={30}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  // Enter soll nur die Kategorie anlegen, nicht das ganze Abo speichern.
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleCreate();
                  }
                }}
              />
              <ColorSwatchPicker label="Farbe" value={color} onChange={setColor} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
                  Abbrechen
                </Button>
                <Button size="sm" icon={Plus} disabled={!name.trim() || saving} onClick={() => void handleCreate()}>
                  Anlegen
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
