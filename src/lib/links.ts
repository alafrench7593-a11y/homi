/**
 * Ouvertures sûres : appel téléphonique, lien externe, retour en arrière.
 * Jamais d'échec muet : si le téléphone ne peut pas appeler (iPad, web, sans carte SIM) ou ouvrir le lien,
 * un message dit quoi faire à la place.
 */
import { Linking } from 'react-native';
import { router, type Href } from 'expo-router';
import { t as tr } from '@/i18n';

type Toast = (msg: string, tone?: 'success' | 'info' | 'error') => void;

/** Lance un appel ; en cas d'impossibilité, affiche « Composez le … ». */
export function callNumber(number: string, toast: Toast): void {
  const digits = number.replace(/[^\d+]/g, '');
  Linking.openURL(`tel:${digits}`).catch(() => toast(tr('l4.links.callFail', { number }), 'error'));
}

/** Ouvre un lien (source, site officiel) ; en cas d'échec, un message plutôt que rien. */
export function openLink(url: string, toast: Toast): void {
  Linking.openURL(url).catch(() => toast(tr('l4.links.openFail'), 'error'));
}

/** Retour en arrière, ou vers l'accueil si l'écran a été ouvert directement (notification, lien). */
export function goBack(fallback: Href = '/(tabs)'): void {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
