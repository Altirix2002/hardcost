import { useRef, useState, type ChangeEvent } from 'react';
import { Circle, ImagePlus, Squircle, Trash2 } from 'lucide-react';
import type { CategoryColor, LogoShape } from '../../../types';
import { imageFileToDataUrl } from '../../../utils/image';
import { Button } from '../../ui/Button';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { SubscriptionLogo } from '../SubscriptionLogo';

interface LogoPickerProps {
  name: string;
  logoUrl: string;
  shape: LogoShape;
  color?: CategoryColor;
  onLogoChange: (logoUrl: string) => void;
  onShapeChange: (shape: LogoShape) => void;
}

const SHAPE_OPTIONS = [
  { value: 'circle' as const, label: 'Rund', icon: Circle },
  { value: 'squircle' as const, label: 'Squircle', icon: Squircle },
];

export function LogoPicker({ name, logoUrl, shape, color, onLogoChange, onShapeChange }: LogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // gleiche Datei erneut wählbar machen
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      onLogoChange(await imageFileToDataUrl(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Das Bild konnte nicht geladen werden.');
    } finally {
      setBusy(false);
    }
  };

  return (
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
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={ImagePlus} disabled={busy} onClick={() => inputRef.current?.click()}>
            {logoUrl ? 'Ersetzen' : 'Logo hochladen'}
          </Button>
          {logoUrl && (
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onLogoChange('')}>
              Entfernen
            </Button>
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
  );
}
