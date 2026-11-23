/**
 * Ouvertures sûres : appel téléphonique, lien externe, retour en arrière.
 * Jamais d'échec muet : si le téléphone ne peut pas appeler (iPad, web, sans carte SIM) ou ouvrir le lien,
 * un message dit quoi faire à la place.
 */
import { Linking } from 'react-native';
import { router, type Href } from 'expo-router';
import { t as tr } from '@/i18n';
import { parentRoute } from './parentRoute';

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

/**
 * Fermer / Retour d'un écran PLEIN ÉCRAN (sans `Screen`) : retour dans l'historique, sinon (lien direct, notification)
 * l'écran PARENT de l'adresse (`parentRoute`, comme le Retour de `Screen`). Audit 01 N-07 : « Fermer » de
 * /sleep/tonight et /sleep/difficult/[id] ouverts par une notification menait à l'Accueil au lieu de l'onglet Bébé.
 */
export function goUp(pathname: string): void {
  if (router.canGoBack()) router.back();
  else router.replace(parentRoute(pathname) as Href);
}
