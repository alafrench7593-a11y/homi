/**
 * Mode d'achat (sans le SDK d'achat) : importable partout, y compris par les composants affichés sur tous les écrans
 * (feuille Premium, profil), sans charger react-native-purchases.
 *  - « store » : clés RevenueCat présentes, application compilée ;
 *  - « test »  : mode démonstration local, l'achat est simulé sur des données fictives (aucun paiement) ;
 *  - « unavailable » : RevenueCat non configuré (dont la version web : pas d'achat intégré sur le web).
 */
import { Platform } from 'react-native';
import { backend } from './backend';
import { localeTag } from '@/i18n';
import { demoPlans, type Plan } from './premium/plans';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;
/** Clé PUBLIQUE RevenueCat de la plateforme (jamais de clé secrète dans l'application). */
export const revenueCatPublicKey = Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined;

export type PurchaseMode = 'store' | 'test' | 'unavailable';
/** Mode d'achat pour un mode de backend et une clé RevenueCat donnés. */
export function purchaseModeFor(backendMode: string, key: string | undefined): PurchaseMode {
  return backendMode === 'demo' ? 'test' : key ? 'store' : 'unavailable';
}
/** Mode COURANT, relu à chaque appel : la démonstration peut être activée après le chargement de l'application. */
export function getPurchaseMode(): PurchaseMode {
  return purchaseModeFor(backend.mode, revenueCatPublicKey);
}

type Sdk = typeof import('./purchases');
/** Module d'achat chargé seulement quand on en a besoin (achat, restauration, gestion, prix de la boutique). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const purchasesSdk = (): Sdk => require('./purchases') as Sdk;

/** Pages officielles de gestion des abonnements (résiliation, moyen de paiement, changement de formule). */
export const MANAGE_URLS = { ios: 'https://apps.apple.com/account/subscriptions', android: 'https://play.google.com/store/account/subscriptions' } as const;
/** Page de gestion de la boutique de cette plateforme (web et iPhone : Apple, l'application étant d'abord iOS). */
export const manageUrl = (os: string = Platform.OS): string => (os === 'android' ? MANAGE_URLS.android : MANAGE_URLS.ios);

/**
 * Démonstration : grille prévue. L'essai n'y est proposé qu'une fois par compte (miroir d'Apple : une offre de
 * lancement par groupe d'abonnements) — un compte de démonstration qui a déjà eu un abonnement voit les formules
 * sans essai, comme une personne non éligible en boutique.
 */
export async function demoPlansForAccount(): Promise<Plan[]> {
  const plans = demoPlans(localeTag());
  let used = false;
  try {
    used = (await backend.rpc<boolean>('demo_trial_used')) === true;
  } catch { /* lecture impossible : grille complète, comme un premier affichage */ }
  return used ? plans.map((p) => ({ ...p, trialDays: 0 })) : plans;
}

/** Formules : boutique (prix réels) ou grille de démonstration, sans charger le SDK hors mode boutique. */
export function loadPlans(): Promise<Plan[]> {
  const mode = getPurchaseMode();
  if (mode === 'store') return purchasesSdk().getPlans();
  return mode === 'test' ? demoPlansForAccount() : Promise.resolve([]);
}
