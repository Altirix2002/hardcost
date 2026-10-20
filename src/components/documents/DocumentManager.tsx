import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, FileText, Paperclip, Trash2 } from 'lucide-react';
import { db } from '../../db/database';
import { addDocument, deleteDocument } from '../../db/repository';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import type { StoredDocument } from '../../types';
import { cn } from '../../utils/cn';
import { DOCUMENT_ACCEPT, formatFileSize, isImageDocument, validateDocumentFile } from '../../utils/documents';
import { formatDate } from '../../utils/format';
import { spring, springWithFade } from '../../utils/motion';
import { Button } from '../ui/Button';
import { DocumentViewer } from './DocumentViewer';

interface DocumentManagerProps {
  subscriptionId: string;
}

const NO_DOCUMENTS: StoredDocument[] = [];

function DocumentThumb({ doc }: { doc: StoredDocument }) {
  const url = useObjectUrl(isImageDocument(doc.fileType) ? doc.blob : null);
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <FileText className="h-5 w-5" aria-hidden />}
    </span>
  );
}

/** Verträge und Belege eines Abos – bleiben ausschliesslich lokal und funktionieren offline. */
export function DocumentManager({ subscriptionId }: DocumentManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const documents =
    useLiveQuery(
      () => db.documents.where('subscriptionId').equals(subscriptionId).sortBy('createdAt'),
      [subscriptionId],
    ) ?? NO_DOCUMENTS;
  const [viewing, setViewing] = useState<StoredDocument | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const closeViewer = useCallback(() => setViewing(null), []);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (files.length === 0) return;
    setBusy(true);
    const problems: string[] = [];
    for (const file of files) {
      const problem = validateDocumentFile(file);
      if (problem) {
        problems.push(problem);
        continue;
      }
      try {
        await addDocument(subscriptionId, file);
      } catch {
        problems.push(`«${file.name}» konnte nicht gespeichert werden (Speicher voll?).`);
      }
    }
    setErrors(problems);
    setBusy(false);
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    await deleteDocument(id);
  };

  return (
    <div className="flex flex-col gap-3">
      {documents.length > 0 && (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {documents.map((doc) => (
              <motion.li
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={springWithFade}
                className="flex items-center gap-3 rounded-2xl border border-zinc-900/10 bg-white/50 p-2 pr-2 dark:border-white/10 dark:bg-zinc-800/40"
              >
                <button
                  type="button"
                  onClick={() => setViewing(doc)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:outline-none"
                >
                  <DocumentThumb doc={doc} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{doc.fileName}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {formatFileSize(doc.fileSize)} · {formatDate(new Date(doc.createdAt), true)}
                    </span>
                  </span>
                </button>
                <motion.button
                  type="button"
                  layout
                  onClick={() => void handleDelete(doc.id)}
                  onBlur={() => setConfirmDelete((current) => (current === doc.id ? null : current))}
                  transition={spring}
                  aria-label={confirmDelete === doc.id ? `${doc.fileName} endgültig löschen` : `${doc.fileName} löschen`}
                  className={cn(
                    'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors',
                    confirmDelete === doc.id
                      ? 'bg-rose-500 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900/5 hover:text-rose-500 dark:hover:bg-white/10',
                  )}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {confirmDelete === doc.id && 'Löschen?'}
                </motion.button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {errors.map((message) => (
        <p key={message} role="alert" className="flex items-center gap-2 px-1 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {message}
        </p>
      ))}

      <input ref={inputRef} type="file" accept={DOCUMENT_ACCEPT} multiple hidden onChange={(e) => void handleFiles(e)} />
      <Button variant="secondary" icon={Paperclip} disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Wird gespeichert …' : 'Dokument hinzufügen'}
      </Button>

      <DocumentViewer document={viewing} onClose={closeViewer} />
    </div>
  );
}
