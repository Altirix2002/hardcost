import { useEffect, useState, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { saveManualOrder } from '../../db/repository';
import type { Category, ExchangeRates, Subscription, SubscriptionViewMode } from '../../types';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import { SubscriptionCard } from './SubscriptionCard';
import { SubscriptionTile } from './SubscriptionTile';

interface ReorderableSubscriptionsProps {
  /** Sichtbare Abos in eigener Reihenfolge (ggf. gefiltert). */
  subscriptions: Subscription[];
  /** Alle Abos der Übersicht in eigener Reihenfolge – gefilterte behalten so ihre Plätze. */
  allOrdered: Subscription[];
  viewMode: SubscriptionViewMode;
  categoriesById: Map<string, Category>;
  baseCurrency: string;
  rates: ExchangeRates | null;
}

interface SortableItemProps {
  id: string;
  index: number;
  className?: string;
  children: ReactNode;
}

/** Ein verschiebbarer Platz: wackelt, solange er nicht gezogen wird; angehoben mit Schatten. */
function SortableItem({ id, index, className, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      // Position und Übergang setzt dnd-kit pro Bild – wie bei framer-motion als Inline-Transform. Nur
      // verschieben, nicht skalieren: Karten unterschiedlicher Höhe würden sonst beim Ziehen gestaucht.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative touch-manipulation', isDragging && 'z-20', className)}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          'h-full transition-[scale,filter] duration-200',
          isDragging ? 'scale-[1.04] drop-shadow-2xl' : 'motion-safe:animate-jiggle',
          // Nachbarn wackeln gegenläufig, sonst wirkt es wie eine einzige schwankende Fläche.
          index % 2 === 1 && '[animation-delay:-0.15s]',
        )}
      >
        {children}
      </div>
    </li>
  );
}

/**
 * Anordnen-Modus für Liste und Kacheln: Karten per Maus, Finger (kurz halten) oder Tastatur verschieben.
 * Die Reihenfolge gilt für beide Ansichten und wird sofort gespeichert. Wischen und Umdrehen sind aus,
 * damit sich die Gesten nicht in die Quere kommen.
 */
export function ReorderableSubscriptions({
  subscriptions,
  allOrdered,
  viewMode,
  categoriesById,
  baseCurrency,
  rates,
}: ReorderableSubscriptionsProps) {
  const [order, setOrder] = useState(() => subscriptions.map((sub) => sub.id));
  const byId = new Map(subscriptions.map((sub) => [sub.id, sub]));
  const idsKey = subscriptions.map((sub) => sub.id).join();

  // Neue Daten (z.B. nach dem Speichern oder Filtern) übernehmen; bis dahin gilt die lokale Reihenfolge –
  // so springt nichts zurück, während die Datenbank noch schreibt.
  useEffect(() => {
    setOrder(idsKey ? idsKey.split(',') : []);
  }, [idsKey]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Kurz halten, dann ziehen – sofortiges Bewegen scrollt weiterhin die Seite.
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
    setOrder(next);
    triggerHaptic(8);
    // Gefilterte Ansicht: Die sichtbaren Abos tauschen nur untereinander ihre Plätze in der Gesamtliste.
    const visible = new Set(next);
    const queue = [...next];
    const full = allOrdered.map((sub) => (visible.has(sub.id) ? (queue.shift() ?? sub.id) : sub.id));
    void saveManualOrder(full);
  };

  const tiles = viewMode === 'tiles';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => triggerHaptic(10)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <ul
          data-no-tab-swipe
          className={cn(
            'grid pb-3',
            tiles ? 'grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5' : 'gap-3 sm:grid-cols-2',
          )}
        >
          {order.map((id, index) => {
            const subscription = byId.get(id);
            if (!subscription) return null;
            const category = categoriesById.get(subscription.categoryId);
            return (
              <SortableItem key={id} id={id} index={index}>
                {tiles ? (
                  <SubscriptionTile
                    subscription={subscription}
                    category={category}
                    baseCurrency={baseCurrency}
                    rates={rates}
                    flippable={false}
                  />
                ) : (
                  <SubscriptionCard
                    subscription={subscription}
                    category={category}
                    baseCurrency={baseCurrency}
                    rates={rates}
                    flippable={false}
                  />
                )}
              </SortableItem>
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
