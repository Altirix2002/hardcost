import { useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { db } from '../../db/database';
import { FALLBACK_CATEGORY_ID, createCategory, deleteCategory, updateCategory } from '../../db/repository';
import type { Category, CategoryColor } from '../../types';
import { sortCategories } from '../../utils/categories';
import { getCategoryColorClasses } from '../../utils/categoryStyles';
import { cn } from '../../utils/cn';
import { INSET_PANEL } from '../../utils/fieldStyles';
import { sheetSpringWithFade } from '../../utils/motion';
import { Button } from '../ui/Button';
import { ColorSwatchPicker } from '../ui/ColorSwatchPicker';
import { TextField } from '../ui/TextField';

/** 'new' = neue Kategorie anlegen, sonst die ID der bearbeiteten Kategorie. */
type EditingTarget = string | null;

interface CategoryEditorProps {
  category?: Category;
  usageCount: number;
  onDone: () => void;
}

function CategoryEditor({ category, usageCount, onDone }: CategoryEditorProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState<CategoryColor>(category?.color ?? 'sky');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const canDelete = category !== undefined && category.id !== FALLBACK_CATEGORY_ID;

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Das hat nicht geklappt.');
      setBusy(false);
    }
  };

  const save = () => {
    if (!name.trim() || busy) return;
    void run(() => (category ? updateCategory(category.id, name, color) : createCategory(name, color)));
  };

  const remove = () => {
    if (!category) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    void run(() => deleteCategory(category.id));
  };

  return (
    <div className={cn(INSET_PANEL, 'mt-2 flex flex-col gap-4')}>
      <TextField
        label="Name"
        placeholder="z.B. Haushalt"
        value={name}
        maxLength={30}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            save();
          }
        }}
      />
      <ColorSwatchPicker label="Farbe" value={color} onChange={setColor} />

      {error && <p className="px-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      {confirmDelete && (
        <p className="px-1 text-xs text-zinc-600 dark:text-zinc-300">
          {usageCount === 0
            ? 'Die Kategorie wird gelöscht.'
            : `${usageCount === 1 ? '1 Abo wandert' : `${usageCount} Abos wandern`} zu «Sonstiges».`}
        </p>
      )}

      <div className="flex items-center gap-2">
        {canDelete && (
          <Button size="sm" variant={confirmDelete ? 'danger' : 'ghost'} icon={Trash2} disabled={busy} onClick={remove}>
            {confirmDelete ? 'Endgültig löschen' : 'Löschen'}
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDone}>
            Abbrechen
          </Button>
          <Button size="sm" icon={category ? Check : Plus} disabled={!name.trim() || busy} onClick={save}>
            {category ? 'Sichern' : 'Anlegen'}
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

/** Kategorien umbenennen, umfärben, löschen und neu anlegen. */
export function CategoryManager() {
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const subscriptions = useLiveQuery(() => db.subscriptions.toArray(), []);
  const [editing, setEditing] = useState<EditingTarget>(null);

  const sorted = useMemo(() => sortCategories(categories ?? []), [categories]);
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const sub of subscriptions ?? []) counts.set(sub.categoryId, (counts.get(sub.categoryId) ?? 0) + 1);
    return counts;
  }, [subscriptions]);

  const toggle = (target: string) => setEditing((current) => (current === target ? null : target));
  const close = () => setEditing(null);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {sorted.map((category) => {
          const count = usage.get(category.id) ?? 0;
          const open = editing === category.id;
          return (
            <li key={category.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(category.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5 text-left transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80"
              >
                <span
                  aria-hidden
                  className={cn('h-3 w-3 shrink-0 rounded-full', getCategoryColorClasses(category.color).solid)}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {count === 1 ? '1 Abo' : `${count} Abos`}
                </span>
                <Pencil className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              </button>
              <Collapsible open={open}>
                <CategoryEditor category={category} usageCount={count} onDone={close} />
              </Collapsible>
            </li>
          );
        })}
      </ul>

      <Button
        variant="secondary"
        icon={Plus}
        aria-expanded={editing === 'new'}
        onClick={() => toggle('new')}
        className="w-full"
      >
        Neue Kategorie
      </Button>
      <Collapsible open={editing === 'new'}>
        <CategoryEditor usageCount={0} onDone={close} />
      </Collapsible>
    </div>
  );
}
