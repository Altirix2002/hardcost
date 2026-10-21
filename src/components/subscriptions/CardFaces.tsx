import type { ReactNode } from 'react';
import type { CardFace } from '../../hooks/useCardFlip';
import { cn } from '../../utils/cn';

interface CardFacesProps {
  face: CardFace;
  front: ReactNode;
  back: ReactNode;
  /** Ruhemodus: Inhalt entsättigt und gedimmt (nicht die Glaskarte selbst – sonst fällt der Blur weg). */
  sleeping?: boolean;
}

/**
 * Die Vorderseite bestimmt die Kartenhöhe wie bisher; die Rückseite liegt deckungsgleich darüber und
 * passt ihren Inhalt per Container-Query an diese Höhe an (siehe .card-back in index.css). So ändert
 * die Karte beim Drehen nie ihre Höhe und die Liste wird durch die Rückseite nicht höher.
 */
export function CardFaces({ face, front, back, sleeping = false }: CardFacesProps) {
  const faceClass = (shown: boolean) =>
    cn('min-w-0 transition-[filter,opacity] duration-700', !shown && 'invisible', sleeping && 'opacity-75 grayscale');

  return (
    <div className="relative h-full">
      <div aria-hidden={face !== 'front'} className={cn('h-full', faceClass(face === 'front'))}>
        {front}
      </div>
      <div
        aria-hidden={face !== 'back'}
        className={cn('card-back absolute inset-0 overflow-hidden', faceClass(face === 'back'))}
      >
        {back}
      </div>
    </div>
  );
}
