/**
 * Mode d'achat (sans le SDK d'achat) : importable partout, y compris par les composants affichés sur tous les écrans
 * (feuille Premium, profil), sans charger react-native-purchases.
 *  - « store » : clés RevenueCat présentes, application compilée ;
 *  - « test »  : mode démonstration local, l'achat est simulé sur des données fictives (aucun paiement) ;
 *  - « unavailable » : RevenueCat non configuré (dont la version web : pas d'achat intégré sur le web).
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from './backend';
import { localeTag } from '@/i18n';
import { demoFamilyPlans, demoPlans, formatMoney, type Plan } from './premium/plans';
import { CREDIT_PACK_IDS, DEMO_PACK_PRICES, PACK_CREDITS, type CreditPackId } from './credits/model';

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
/**
 * DÉMONSTRATION SEULEMENT (faux magasin, mode « test ») : issues simulées pour rejouer le parcours d'achat dans la
 * version web (e2e/paywall_premiere_reussite.py). Jamais lu en mode boutique.
 *  - `homi.demo.purchase-sim` : cancelled | deferred | pending | network ;
 *  - `homi.demo.catalog-sim`  : offline | error (catalogue illisible) | notrial (aucun essai pour ce compte).
 */
export const DEMO_PURCHASE_SIM_KEY = 'homi.demo.purchase-sim';
export const DEMO_CATALOG_SIM_KEY = 'homi.demo.catalog-sim';
async function readSim(key: string): Promise<string | null> {
  if (getPurchaseMode() !== 'test') return null;
  try { return await AsyncStorage.getItem(key); } catch { return null; }
}
export async function demoPurchaseSimulation(): Promise<'cancelled' | 'deferred' | 'pending' | 'network' | null> {
  const v = await readSim(DEMO_PURCHASE_SIM_KEY);
  return v === 'cancelled' || v === 'deferred' || v === 'pending' || v === 'network' ? v : null;
}

export async function demoPlansForAccount(): Promise<Plan[]> {
  const sim = await readSim(DEMO_CATALOG_SIM_KEY);
  if (sim === 'offline' || sim === 'error') throw new Error(sim === 'offline' ? 'Network request failed' : 'catalog_unavailable');
  const plans = demoPlans(localeTag());
  if (sim === 'notrial') return plans.map((p) => ({ ...p, trialDays: 0 }));
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

/** Formule Famille : boutique (prix réels) ou grille de démonstration. */
export function loadFamilyPlans(): Promise<Plan[]> {
  const mode = getPurchaseMode();
  if (mode === 'store') return purchasesSdk().getFamilyPlans();
  if (mode !== 'test') return Promise.resolve([]);
  return readSim(DEMO_CATALOG_SIM_KEY).then((sim) => {
    if (sim === 'offline' || sim === 'error') throw new Error(sim === 'offline' ? 'Network request failed' : 'catalog_unavailable');
    return demoFamilyPlans(localeTag());
  });
}

/** Pack de crédits proposé (le paquet de la boutique n'est chargé qu'en mode boutique). */
export interface PackChoice { id: CreditPackId; credits: number; price: string; demo: boolean; pkg?: unknown; product?: unknown }

/** Packs de crédits : prix de la boutique, ou grille de démonstration (faux magasin) ; sinon aucun (jamais de prix inventé). */
export async function loadCreditPacks(): Promise<PackChoice[]> {
  const mode = getPurchaseMode();
  if (mode === 'store') return purchasesSdk().getCreditPacks();
  if (mode !== 'test') return [];
  return CREDIT_PACK_IDS.map((id) => ({ id, credits: PACK_CREDITS[id], price: formatMoney(DEMO_PACK_PRICES[id], 'EUR', localeTag()), demo: true }));
}
