import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import type { StoredDocument } from '../../types';
import { formatFileSize, isImageDocument } from '../../utils/documents';
import { sheetSpringWithFade } from '../../utils/motion';
import { Button } from '../ui/Button';

const VIEWER_BUTTON =
  'flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none';

interface DocumentViewerProps {
  document: StoredDocument | null;
  onClose: () => void;
}

/**
 * Vollflächige Vorschau über allen Modals. Per Portal direkt im <body>: Im verschobenen
 * Formular-Sheet würde `fixed` sonst nur das Sheet statt den ganzen Bildschirm füllen.
 */
export function DocumentViewer({ document: doc, onClose }: DocumentViewerProps) {
  const url = useObjectUrl(doc?.blob ?? null);
  const open = doc !== null;

  // Escape schliesst nur die Vorschau, nicht zusätzlich das Formular darunter (Capture-Phase).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {doc && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={doc.fileName}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col bg-zinc-950/85 text-white backdrop-blur-2xl"
        >
          <div className="flex shrink-0 items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{doc.fileName}</p>
              <p className="text-xs text-white/60">{formatFileSize(doc.fileSize)}</p>
            </div>
            {url && (
              <a
                href={url}
                download={doc.fileName}
                aria-label="Herunterladen"
                title="Herunterladen"
                className={VIEWER_BUTTON}
              >
                <Download className="h-5 w-5" aria-hidden />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Vorschau schliessen"
              title="Schliessen"
              className={VIEWER_BUTTON}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            transition={sheetSpringWithFade}
            className="flex min-h-0 flex-1 items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {url && isImageDocument(doc.fileType) && (
              <img src={url} alt={doc.fileName} className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" />
            )}
            {url && !isImageDocument(doc.fileType) && (
              <>
                {/* Eingebettete PDFs können nur Desktop-Browser zuverlässig anzeigen. */}
                <iframe
                  src={url}
                  title={doc.fileName}
                  className="hidden h-full w-full max-w-4xl rounded-2xl bg-white sm:block"
                />
                <div className="flex flex-col items-center gap-4 text-center sm:hidden">
                  <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                    <FileText className="h-10 w-10" aria-hidden />
                  </span>
                  <p className="max-w-xs text-sm text-white/70">PDF in der Vorschau deines Geräts öffnen.</p>
                  <Button icon={ExternalLink} onClick={() => window.open(url, '_blank', 'noopener')}>
                    PDF öffnen
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
