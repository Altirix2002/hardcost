import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Loader2, RotateCcw, Squircle, ZoomIn, ZoomOut } from 'lucide-react';
import type { LogoCrop, LogoShape, LogoSource } from '../../../types';
import { cn } from '../../../utils/cn';
import { FIELD_LABEL, INSET_PANEL } from '../../../utils/fieldStyles';
import {
  BLACK,
  LOGO_ZOOM_MAX,
  LOGO_ZOOM_MIN,
  WHITE,
  detectEdgeColor,
  drawLogo,
  exportLogo,
  getInitialCrop,
  loadImage,
} from '../../../utils/image';
import { LOGO_SHAPE_CLASSES } from '../../../utils/logoStyles';
import { spring } from '../../../utils/motion';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { SegmentedControl } from '../../ui/SegmentedControl';

interface LogoEditorProps {
  source: LogoSource;
  shape: LogoShape;
  onShapeChange: (shape: LogoShape) => void;
  onCancel: () => void;
  onApply: (logoUrl: string) => void;
}

interface BackgroundOption {
  label: string;
  color: string;
}

const SHAPE_OPTIONS = [
  { value: 'circle' as const, label: 'Rund', icon: Circle },
  { value: 'squircle' as const, label: 'Squircle', icon: Squircle },
];

/** Darstellungsgrösse der Vorschau in CSS-Pixeln (entspricht w-56). */
const PREVIEW_SIZE = 224;

const clampZoom = (zoom: number) => Math.min(LOGO_ZOOM_MAX, Math.max(LOGO_ZOOM_MIN, zoom));
const clampOffset = (offset: number) => Math.min(1, Math.max(-1, offset));

/** Zuschneiden per Ziehen, Pinch, Mausrad oder Regler – die Maske zeigt Kreis bzw. Squircle. */
export function LogoEditor({ source, shape, onShapeChange, onCancel, onApply }: LogoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [initialCrop, setInitialCrop] = useState<LogoCrop | null>(null);
  const [crop, setCrop] = useState<LogoCrop | null>(null);
  const [edgeColor, setEdgeColor] = useState(WHITE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadImage(source.src)
      .then((loaded) => {
        if (cancelled) return;
        const start = getInitialCrop(loaded, source);
        setImage(loaded);
        setEdgeColor(detectEdgeColor(loaded));
        setInitialCrop(start);
        setCrop(start);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Das Bild konnte nicht geladen werden.');
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  // Vorschau in Geräteauflösung neu zeichnen.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !image || !crop) return;
    const size = Math.round(PREVIEW_SIZE * Math.min(3, window.devicePixelRatio || 1));
    if (canvas.width !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    context.imageSmoothingQuality = 'high';
    drawLogo(context, size, image, crop, source.monochrome);
  }, [image, crop, source.monochrome]);

  // Mausrad-Zoom braucht einen nicht-passiven Listener, sonst scrollt das Sheet mit.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setCrop((current) => current && { ...current, zoom: clampZoom(current.zoom * Math.exp(-event.deltaY * 0.0015)) });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [image]);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const others = [...pointers.current.entries()].filter(([id]) => id !== event.pointerId).map(([, point]) => point);
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);
    const displaySize = event.currentTarget.getBoundingClientRect().width || PREVIEW_SIZE;

    const [other] = others;
    if (other) {
      // Pinch: Zoom folgt dem Abstand der beiden Finger.
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (before > 0) setCrop((current) => current && { ...current, zoom: clampZoom(current.zoom * (after / before)) });
      return;
    }
    setCrop(
      (current) =>
        current && {
          ...current,
          offsetX: clampOffset(current.offsetX + (next.x - previous.x) / displaySize),
          offsetY: clampOffset(current.offsetY + (next.y - previous.y) / displaySize),
        },
    );
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(event.pointerId);
  };

  const backgrounds: BackgroundOption[] = [
    ...(source.brandColor ? [{ label: 'Markenfarbe', color: source.brandColor }] : []),
    ...(!source.monochrome && edgeColor !== WHITE && edgeColor !== BLACK ? [{ label: 'Bildrand', color: edgeColor }] : []),
    { label: 'Weiss', color: WHITE },
    { label: 'Schwarz', color: BLACK },
  ];

  const apply = () => {
    if (!image || !crop) return;
    try {
      onApply(exportLogo(image, crop, source.monochrome));
    } catch {
      setError('Dieses Bild lässt sich nicht speichern. Bitte ein anderes wählen.');
    }
  };

  return (
    <div className={cn(INSET_PANEL, 'flex flex-col gap-4')}>
      <div className="px-1">
        <p className="text-sm font-medium">Logo zuschneiden</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Ziehen zum Verschieben, mit zwei Fingern oder Mausrad zoomen.</p>
      </div>

      <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-2xl bg-zinc-900/5 dark:bg-white/5">
        {crop ? (
          <canvas
            ref={canvasRef}
            aria-label="Logo-Vorschau zum Zuschneiden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            {error ? (
              <p className="px-6 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p>
            ) : (
              <Loader2 className="h-6 w-6 animate-spin" aria-label="Bild wird geladen" />
            )}
          </div>
        )}
        {/* Maske: Bereich ausserhalb von Kreis/Squircle abdunkeln. */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 shadow-[0_0_0_200px_rgb(9_9_11/0.5)] ring-2 ring-white/80 transition-[border-radius] duration-500 ease-out',
            LOGO_SHAPE_CLASSES[shape],
          )}
        />
      </div>

      {crop && (
        <>
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            <input
              type="range"
              aria-label="Zoom"
              min={LOGO_ZOOM_MIN}
              max={LOGO_ZOOM_MAX}
              step={0.01}
              value={crop.zoom}
              onChange={(event) => setCrop({ ...crop, zoom: Number(event.target.value) })}
              className="h-2 min-w-0 flex-1 cursor-pointer accent-zinc-900 dark:accent-white"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            <IconButton
              icon={RotateCcw}
              label="Zuschnitt zurücksetzen"
              onClick={() => initialCrop && setCrop({ ...initialCrop, background: crop.background })}
              className="-mr-2"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={FIELD_LABEL}>Hintergrund</span>
              <div role="radiogroup" aria-label="Hintergrund" className="flex gap-2">
                {backgrounds.map((option) => {
                  const selected = option.color.toLowerCase() === crop.background.toLowerCase();
                  return (
                    <motion.button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setCrop({ ...crop, background: option.color })}
                      whileTap={{ scale: 0.88 }}
                      transition={spring}
                      className={cn(
                        'rounded-full ring-offset-2 ring-offset-white dark:ring-offset-zinc-900',
                        selected && 'ring-2 ring-zinc-900 dark:ring-white',
                      )}
                    >
                      {/* SVG-Füllung statt Inline-Style: beliebige Farben ohne style-Attribut. */}
                      <svg viewBox="0 0 28 28" className="block h-7 w-7" aria-hidden>
                        <circle cx="14" cy="14" r="13.25" fill={option.color} strokeWidth="1.5" className="stroke-zinc-900/15 dark:stroke-white/25" />
                      </svg>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <SegmentedControl
              options={SHAPE_OPTIONS}
              value={shape}
              onChange={onShapeChange}
              layoutId="logo-editor-shape"
              ariaLabel="Logo-Form"
              iconOnly
            />
          </div>

          {error && <p className="px-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button size="sm" icon={Check} disabled={!crop} onClick={apply}>
          Übernehmen
        </Button>
      </div>
    </div>
  );
}
