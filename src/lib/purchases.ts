/**
 * Abonnements (RevenueCat → achats intégrés Apple / Google).
 * La boutique encaisse ; RevenueCat prévient le serveur (webhook) ; l'application demande en plus au serveur de relire
 * RevenueCat (fonction subscription-sync) après un achat, une restauration, ou quand l'état de l'appareil (CustomerInfo)
 * diffère de celui du serveur. Les DROITS sont toujours décidés par le serveur (has_premium).
 *
 * Modes :
 *  - « store » : clés RevenueCat présentes, application compilée (build de développement ou de production) ;
 *  - « test »  : mode démonstration local, l'achat est simulé sur des données fictives (aucun paiement) ;
 *  - « unavailable » : Supabase branché mais RevenueCat pas configuré (dont la version web : pas d'achat sur le web).
 *
 * SDK : configuré UNE SEULE FOIS (Purchases.configure) ; changement de compte → Purchases.logIn(id Supabase),
 * déconnexion → Purchases.logOut(). appUserID = identifiant Supabase : même compte sur un nouveau téléphone ou après
 * réinstallation → mêmes achats.
 */
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { backend } from './backend';
import { eq } from './backend/types';
import { localeTag, t as tr } from '@/i18n';
import { deviceState, needsServerSync } from './premium/customerSync';
import { notifySubscriptionChanged } from './premium/syncEvents';
import { getPurchaseMode, purchaseModeFor, revenueCatPublicKey, type PurchaseMode } from './purchaseMode';
import type { SubRow } from './premium/entitlement';
import { buildPlans, demoPlans, periodOfProduct, PREMIUM_ENTITLEMENT, productChangeFor, type Plan } from './premium/plans';

export { billingDates, type Plan } from './premium/plans';

const apiKey = revenueCatPublicKey;
export { getPurchaseMode, purchaseModeFor, type PurchaseMode };

// ---------------------------------------------------------------- configuration (une seule fois) et compte
let configured = false;
let currentUser: string | null = null;
let ready: Promise<void> | null = null;

export async function configurePurchases(userId: string) {
  if (getPurchaseMode() !== 'store' || !apiKey) return;
  if (configured && currentUser === userId) return ready ?? undefined;
  ready = (async () => {
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: userId });
      configured = true;
      Purchases.addCustomerInfoUpdateListener((info) => { void checkCustomerInfo(info); });
    } else {
      await Purchases.logIn(userId);
    }
    currentUser = userId;
    // À l'ouverture : l'état RevenueCat de l'appareil est-il celui du serveur ?
    await Purchases.getCustomerInfo().then((info) => checkCustomerInfo(info)).catch(() => undefined);
  })();
  return ready;
}

export async function resetPurchasesUser() {
  // Déconnexion : le SDK reste configuré (jamais reconfiguré) ; la connexion suivante passera par logIn
  if (!configured || !currentUser) return;
  currentUser = null;
  ready = null;
  try {
    await Purchases.logOut();
  } catch {
    // utilisateur déjà anonyme : rien à faire
  }
}

/** Pour les tests : état du module. */
export const __purchasesState = () => ({ configured, currentUser });

// ---------------------------------------------------------------- synchronisation avec le serveur
let lastSyncAt = 0;
const MIN_SYNC_INTERVAL = 30_000;

/** Demande au serveur de relire RevenueCat. Ne lève jamais d'erreur (le serveur limite aussi le débit). */
export async function syncSubscription(force = false): Promise<{ synced: boolean; premium?: boolean; reason?: string }> {
  if (getPurchaseMode() !== 'store') return { synced: false, reason: 'not_store' };
  if (!force && Date.now() - lastSyncAt < MIN_SYNC_INTERVAL) return { synced: false, reason: 'throttled' };
  lastSyncAt = Date.now();
  try {
    const out = await backend.invoke<{ synced: boolean; premium?: boolean; reason?: string }>('subscription-sync', {});
    notifySubscriptionChanged();
    return out ?? { synced: false };
  } catch {
    return { synced: false, reason: 'unavailable' };
  }
}

async function serverRow(userId: string): Promise<SubRow | null> {
  const rows = await backend.select<SubRow>({ table: 'subscriptions', filters: [eq('user_id', userId)] });
  return rows[0] ?? null;
}

/** CustomerInfo reçu (ouverture, achat, renouvellement vu par l'appareil) : synchronisation si l'état diffère du serveur. */
export async function checkCustomerInfo(info: CustomerInfo | null): Promise<boolean> {
  const user = currentUser;
  if (!user || !info) return false;
  try {
    if (!needsServerSync(deviceState(info, PREMIUM_ENTITLEMENT), await serverRow(user))) return false;
  } catch {
    return false;
  }
  await syncSubscription();
  return true;
}

// ---------------------------------------------------------------- formules
export async function getPlans(): Promise<Plan[]> {
  const mode = getPurchaseMode();
  if (mode === 'test') return demoPlans(localeTag());
  if (mode !== 'store') return []; // jamais de prix inventé hors démonstration
  if (ready) await ready.catch(() => undefined);
  const offerings = await Purchases.getOfferings();
  const plans = buildPlans(offerings.current?.availablePackages ?? [], Platform.OS, localeTag());
  return applyTrialEligibility(plans);
}

/**
 * iOS : Apple n'accorde l'essai qu'une fois par groupe d'abonnements. On n'affiche « 3 jours offerts » que si la
 * boutique confirme l'éligibilité ; statut inconnu, non éligible ou erreur → prix normal affiché.
 * Android : la durée d'essai vient déjà de l'option réellement appliquée à l'achat (defaultOption.freePhase) ;
 * Google Play retire l'offre « nouveaux clients » une fois utilisée.
 */
export async function applyTrialEligibility(plans: Plan[], os: string = Platform.OS): Promise<Plan[]> {
  if (os !== 'ios') return plans;
  const withTrial = plans.filter((p) => p.trialDays > 0).map((p) => p.id);
  if (!withTrial.length) return plans;
  let status: Record<string, { status: number }> = {};
  try {
    status = await Purchases.checkTrialOrIntroductoryPriceEligibility(withTrial);
  } catch {
    status = {};
  }
  return plans.map((p) => (status[p.id]?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE ? p : { ...p, trialDays: 0 }));
}

// ---------------------------------------------------------------- achat, restauration, gestion
export type PurchaseOutcome = 'confirmed' | 'pending' | 'cancelled';

/** Abonnement personnel actif vu par l'appareil (pour un changement de formule sans double abonnement). */
async function activeStoreProduct(): Promise<string | null> {
  try {
    const st = deviceState(await Purchases.getCustomerInfo(), PREMIUM_ENTITLEMENT);
    return st.active ? st.productId : null;
  } catch {
    return null;
  }
}

/** Achat (ou changement de formule). « confirmed » seulement quand le SERVEUR confirme les droits. */
export async function purchase(plan: Plan, opts: { currentProductId?: string | null } = {}): Promise<PurchaseOutcome> {
  const purchaseMode = getPurchaseMode();
  if (purchaseMode === 'test') {
    // Démonstration : données locales fictives, aucun paiement ; essai seulement si la grille en prévoit un
    await backend.rpc('set_demo_subscription', { active: true, period: plan.period, product_id: plan.id, trial: plan.trialDays > 0, trial_days: plan.trialDays });
    return 'confirmed';
  }
  if (purchaseMode !== 'store' || !plan.pkg) throw new Error(tr('l1.pur.notConfigured'));
  if (ready) await ready.catch(() => undefined);
  const current = opts.currentProductId ?? (Platform.OS === 'android' ? await activeStoreProduct() : null);
  const change = productChangeFor(Platform.OS, current, periodOfProduct(current), plan);
  try {
    await Purchases.purchasePackage(plan.pkg, null, change as never);
  } catch (e) {
    if ((e as { userCancelled?: boolean | null })?.userCancelled) return 'cancelled';
    throw e;
  }
  await syncSubscription(true);
  return (await waitForServerEntitlement()) ? 'confirmed' : 'pending';
}

export async function restore(): Promise<boolean> {
  const purchaseMode = getPurchaseMode();
  if (purchaseMode === 'test') return backend.rpc<boolean>('has_premium');
  if (purchaseMode !== 'store') throw new Error(tr('l1.pur.notConfigured'));
  if (ready) await ready.catch(() => undefined);
  await Purchases.restorePurchases();
  // Un achat restauré ne déclenche pas toujours de webhook : le serveur relit RevenueCat
  await syncSubscription(true);
  return waitForServerEntitlement(8000);
}

/** Pages officielles de gestion des abonnements (résiliation, moyen de paiement, changement de formule). */
export const MANAGE_URLS = { ios: 'https://apps.apple.com/account/subscriptions', android: 'https://play.google.com/store/account/subscriptions' } as const;

/** Gestion officielle : feuille Apple (iOS), page Google Play (Android). Renvoie l'URL à ouvrir si l'appli doit l'ouvrir. */
export async function manageSubscription(): Promise<string | null> {
  const purchaseMode = getPurchaseMode();
  if (purchaseMode === 'test') {
    await backend.rpc('set_demo_subscription', { active: false });
    return null;
  }
  if (purchaseMode !== 'store') return Platform.OS === 'android' ? MANAGE_URLS.android : MANAGE_URLS.ios;
  if (Platform.OS === 'ios') {
    try {
      await Purchases.showManageSubscriptions();
      return null;
    } catch {
      return MANAGE_URLS.ios;
    }
  }
  try {
    return (await Purchases.getCustomerInfo()).managementURL ?? MANAGE_URLS.android;
  } catch {
    return MANAGE_URLS.android;
  }
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

// ---------------------------------------------------------------- offres du 07/11/2026 : Assistant IA, outils à vie
/** Prix réels de la boutique pour ces produits (jamais de prix inventé ; démonstration : grille DEMO_OFFER_PRICES). */
export async function getOfferPrices(productIds: string[]): Promise<Record<string, string>> {
  if (getPurchaseMode() !== 'store' || !productIds.length) return {};
  if (ready) await ready.catch(() => undefined);
  const out: Record<string, string> = {};
  for (const cat of [Purchases.PRODUCT_CATEGORY.SUBSCRIPTION, Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION]) {
    try {
      for (const p of await Purchases.getProducts(productIds, cat)) out[p.identifier] = p.priceString;
    } catch { /* produit absent de la boutique : pas de prix affiché */ }
  }
  return out;
}

/**
 * Achat d'un abonnement Assistant IA ou d'un outil à vie. « confirmed » seulement quand le SERVEUR voit le droit
 * (my_access), après relecture de RevenueCat par subscription-sync.
 */
export async function purchaseOffer(productId: string, entitlement: string, kind: 'subscription' | 'lifetime'): Promise<PurchaseOutcome> {
  const mode = getPurchaseMode();
  if (mode === 'test') {
    await backend.rpc('set_demo_grant', { entitlement, product_id: productId });
    return 'confirmed';
  }
  if (mode !== 'store') throw new Error(tr('l1.pur.notConfigured'));
  if (ready) await ready.catch(() => undefined);
  const products = await Purchases.getProducts([productId], kind === 'subscription' ? Purchases.PRODUCT_CATEGORY.SUBSCRIPTION : Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  if (!products[0]) throw new Error(tr('offer.notInStore'));
  try {
    await Purchases.purchaseStoreProduct(products[0]);
  } catch (e) {
    if ((e as { userCancelled?: boolean | null })?.userCancelled) return 'cancelled';
    throw e;
  }
  await syncSubscription(true);
  const start = Date.now();
  while (Date.now() - start < 20000) {
    const a = await backend.rpc<{ ai?: boolean; tools?: { key: string; owned: boolean; product_id: string }[] } | null>('my_access').catch(() => null);
    if (kind === 'subscription' ? a?.ai : a?.tools?.some((t) => t.product_id === productId && t.owned)) return 'confirmed';
    await new Promise((r) => setTimeout(r, 2000));
  }
  return 'pending';
}
