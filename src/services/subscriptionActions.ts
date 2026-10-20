import { deleteSubscription, restoreSubscription, saveSubscription } from '../db/repository';
import { showToast } from '../store/useToastStore';
import type { Subscription } from '../types';
import { isPausedAt, pauseSubscription, resumeSubscription } from '../utils/pauses';
import { markReviewed } from '../utils/review';

/**
 * Schnellaktionen ausserhalb des Formulars (Wischgeste, Zombie-Hinweis) – jeweils mit
 * Dynamic-Island-Meldung und, wo sinnvoll, "Rückgängig".
 */

const undoTo = (previous: Subscription) => ({
  label: 'Rückgängig',
  onPress: () => void saveSubscription(previous),
});

/** Pausiert unbefristet bzw. setzt ein pausiertes Abo fort. Zählt als Prüfung (Zombie-Erkennung). */
export async function togglePause(sub: Subscription): Promise<void> {
  if (isPausedAt(sub)) {
    await saveSubscription(markReviewed(resumeSubscription(sub)));
    showToast('resumed', `${sub.name} läuft wieder`, undoTo(sub));
    return;
  }
  await saveSubscription(markReviewed(pauseSubscription(sub, null)));
  showToast('paused', `${sub.name} pausiert`, undoTo(sub));
}

export async function confirmStillUsed(sub: Subscription): Promise<void> {
  await saveSubscription(markReviewed(sub));
  showToast('success', `${sub.name} bestätigt – nächste Frage in 6 Monaten`);
}

/** Löscht sofort; "Rückgängig" stellt Abo und Dokumente wieder her. */
export async function deleteWithUndo(sub: Subscription): Promise<void> {
  const snapshot = await deleteSubscription(sub.id);
  if (!snapshot) return;
  showToast('deleted', `${sub.name} gelöscht`, {
    label: 'Rückgängig',
    onPress: () => {
      void restoreSubscription(snapshot).then(() => showToast('success', `${sub.name} wiederhergestellt`));
    },
  });
}
