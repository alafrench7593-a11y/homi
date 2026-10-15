/**
 * Abonnements (RevenueCat → achats intégrés Apple / Google).
 * La boutique encaisse ; RevenueCat prévient le serveur (webhook) ;
 * les DROITS sont toujours vérifiés côté serveur (fonction has_premium).
 *
 * Modes :
 *  - « store » : clés RevenueCat présentes, application compilée (build de développement ou de production) ;
 *  - « test »  : mode démonstration local, l'achat est simulé (aucun paiement) ;
 *  - « unavailable » : Supabase branché mais RevenueCat pas encore configuré.
 */
import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { backend } from './backend';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;
const apiKey = Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined;

export type PurchaseMode = 'store' | 'test' | 'unavailable';
export const purchaseMode: PurchaseMode = backend.mode === 'demo' ? 'test' : apiKey ? 'store' : 'unavailable';

export interface Plan {
  id: string;
  period: 'monthly' | 'annual';
  title: string;
  price: string;
  detail: string;
  trialLabel?: string;
  pkg?: PurchasesPackage;
}

// Prix affichés en mode test uniquement ; en production ils viennent de la boutique
const TEST_PLANS: Plan[] = [
  { id: 'toietmoi_premium_monthly', period: 'monthly', title: 'Mensuel', price: '5,99 €', detail: 'par mois, sans engagement' },
  { id: 'toietmoi_premium_annual', period: 'annual', title: 'Annuel', price: '39,99 €', detail: 'par an — soit environ 3,33 € par mois', trialLabel: '7 jours offerts' },
];

let configuredFor: string | null = null;

export async function configurePurchases(userId: string) {
  if (purchaseMode !== 'store' || !apiKey) return;
  if (configuredFor === userId) return;
  if (!configuredFor) Purchases.configure({ apiKey, appUserID: userId });
  else await Purchases.logIn(userId);
  configuredFor = userId;
}

export async function resetPurchasesUser() {
  if (purchaseMode !== 'store' || !configuredFor) return;
  try {
    await Purchases.logOut();
  } catch {
    // utilisateur anonyme : rien à faire
  }
  configuredFor = null;
}

export async function getPlans(): Promise<Plan[]> {
  if (purchaseMode !== 'store') return TEST_PLANS;
  const offerings = await Purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  return pkgs
    .filter((p) => p.packageType === 'MONTHLY' || p.packageType === 'ANNUAL')
    .map((p) => ({
      id: p.product.identifier,
      period: p.packageType === 'ANNUAL' ? 'annual' : 'monthly',
      title: p.packageType === 'ANNUAL' ? 'Annuel' : 'Mensuel',
      price: p.product.priceString,
      detail: p.packageType === 'ANNUAL' ? 'par an' : 'par mois, sans engagement',
      trialLabel: p.product.introPrice?.price === 0 ? `${p.product.introPrice.periodNumberOfUnits} ${p.product.introPrice.periodUnit === 'DAY' ? 'jours' : p.product.introPrice.periodUnit === 'WEEK' ? 'semaines' : 'mois'} offerts` : undefined,
      pkg: p,
    }));
}

/** Achat. Retourne true si les droits sont confirmés PAR LE SERVEUR. */
export async function purchase(plan: Plan): Promise<boolean> {
  if (purchaseMode === 'test') {
    await backend.rpc('set_demo_subscription', { active: true, period: plan.period, product_id: plan.id, trial: !!plan.trialLabel });
    return true;
  }
  if (purchaseMode !== 'store' || !plan.pkg) throw new Error('Les achats ne sont pas encore configurés pour cette version.');
  await Purchases.purchasePackage(plan.pkg);
  return waitForServerEntitlement();
}

export async function restore(): Promise<boolean> {
  if (purchaseMode === 'test') return backend.rpc<boolean>('has_premium');
  if (purchaseMode !== 'store') throw new Error('Les achats ne sont pas encore configurés pour cette version.');
  await Purchases.restorePurchases();
  return waitForServerEntitlement();
}

export async function manageSubscription() {
  if (purchaseMode === 'test') {
    await backend.rpc('set_demo_subscription', { active: false });
    return;
  }
  if (purchaseMode === 'store') await Purchases.showManageSubscriptions();
}

/** Le webhook RevenueCat met quelques secondes à arriver : on interroge le serveur. */
async function waitForServerEntitlement(timeoutMs = 20000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await backend.rpc<boolean>('has_premium')) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}
