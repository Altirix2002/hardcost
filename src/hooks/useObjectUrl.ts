import { useEffect, useState } from 'react';

/**
 * Temporäre URL für einen Blob (Bild-/PDF-Vorschau). Wird beim Wechsel des Blobs und beim
 * Unmount per `URL.revokeObjectURL` freigegeben, damit kein Speicher liegen bleibt.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}
