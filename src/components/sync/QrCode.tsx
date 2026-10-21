import { useMemo } from 'react';
import { encode } from 'uqr';

interface QrCodeProps {
  value: string;
  label: string;
}

/**
 * QR-Code als ein einziger SVG-Pfad (kein innerHTML). Immer schwarz auf weiss mit Ruhezone –
 * auch im Dark Mode, sonst lesen manche Kameras ihn nicht.
 */
export function QrCode({ value, label }: QrCodeProps) {
  const { size, path } = useMemo(() => {
    const qr = encode(value, { ecc: 'M', border: 2 });
    const segments: string[] = [];
    qr.data.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) segments.push(`M${x} ${y}h1v1h-1z`);
      }),
    );
    return { size: qr.size, path: segments.join('') };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className="mx-auto aspect-square w-full max-w-64 rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5"
    >
      <path d={path} fill="#000" />
    </svg>
  );
}
