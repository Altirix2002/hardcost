import { useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Circle, Crop, ImagePlus, Search, Squircle, Trash2 } from 'lucide-react';
import type { CategoryColor, LogoShape, LogoSource } from '../../../types';
import { fileToEditableDataUrl } from '../../../utils/image';
import { sheetSpringWithFade } from '../../../utils/motion';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { SubscriptionLogo } from '../SubscriptionLogo';
import { LogoEditor } from './LogoEditor';
import { LogoSearch } from './LogoSearch';

interface LogoPickerProps {
  name: string;
  logoUrl: string;
  shape: LogoShape;
  color?: CategoryColor;
  onLogoChange: (logoUrl: string) => void;
  onShapeChange: (shape: LogoShape) => void;
}

type PickerPanel = { mode: 'idle' } | { mode: 'search' } | { mode: 'edit'; source: LogoSource };

const SHAPE_OPTIONS = [
  { value: 'circle' as const, label: 'Rund', icon: Circle },
  { value: 'squircle' as const, label: 'Squircle', icon: Squircle },
];

export function LogoPicker({ name, logoUrl, shape, color, onLogoChange, onShapeChange }: LogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<PickerPanel>({ mode: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // gleiche Datei erneut wählbar machen
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      setPanel({ mode: 'edit', source: { src: await fileToEditableDataUrl(file) } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Das Bild konnte nicht geladen werden.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => setPanel({ mode: 'idle' });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <SubscriptionLogo
          key={logoUrl}
          name={name.trim() || '?'}
          logoUrl={logoUrl || undefined}
          shape={shape}
          color={color}
          size="lg"
        />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={Search}
              aria-expanded={panel.mode === 'search'}
              onClick={() => setPanel(panel.mode === 'search' ? { mode: 'idle' } : { mode: 'search' })}
            >
              Suchen
            </Button>
            <Button size="sm" variant="secondary" icon={ImagePlus} disabled={busy} onClick={() => inputRef.current?.click()}>
              Hochladen
            </Button>
            {logoUrl && (
              <>
                <IconButton
                  icon={Crop}
                  label="Logo zuschneiden"
                  onClick={() => setPanel({ mode: 'edit', source: { src: logoUrl } })}
                />
                <IconButton icon={Trash2} label="Logo entfernen" onClick={() => onLogoChange('')} />
              </>
            )}
          </div>
          <SegmentedControl
            options={SHAPE_OPTIONS}
            value={shape}
            onChange={onShapeChange}
            layoutId="logo-shape"
            ariaLabel="Logo-Form"
          />
          {error && <p className="px-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e)} />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {panel.mode !== 'idle' && (
          <motion.div
            key={panel.mode === 'edit' ? `edit-${panel.source.src.slice(-32)}` : 'search'}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={sheetSpringWithFade}
            className="overflow-hidden"
          >
            {panel.mode === 'search' ? (
              <LogoSearch
                initialQuery={name.trim()}
                onPick={(source) => setPanel({ mode: 'edit', source })}
                onCancel={close}
              />
            ) : (
              <LogoEditor
                source={panel.source}
                shape={shape}
                onShapeChange={onShapeChange}
                onCancel={close}
                onApply={(url) => {
                  onLogoChange(url);
                  close();
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
