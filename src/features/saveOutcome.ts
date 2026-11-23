/**
 * Message après une saisie envoyée par `insertOrQueue` (audit 05, 13/11/2026) : hors connexion, la saisie est gardée
 * sur l'appareil et envoyée au retour du réseau. Le dire tel quel : jamais « enregistré » quand rien n'est encore
 * arrivé sur le serveur (le foyer ne la voit pas encore).
 */
import type { useToast } from '@/components/Overlays';
import { t as tr } from '@/i18n';

type Toast = ReturnType<typeof useToast>;

export function toastSaved(toast: Toast, outcome: 'sent' | 'queued', sentMessage: string) {
  if (outcome === 'queued') toast(tr('u7.track.queued'), 'info');
  else toast(sentMessage);
}
