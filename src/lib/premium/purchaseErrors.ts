/**
 * Erreurs d'achat RevenueCat → catégorie affichable (logique pure, testée par Jest ; sans charger le SDK).
 * Codes : PURCHASES_ERROR_CODE de react-native-purchases 10 (@revenuecat/purchases-typescript-internal,
 * generated/error-codes) — l'erreur porte `code` (chaîne) et `userCancelled`.
 * Règle : jamais de faux succès. « deferred » (Demander l'achat / Ask to Buy, paiement en attente) n'ouvre rien :
 * le droit n'arrive que quand la boutique confirme, et le serveur (has_premium) reste la seule source.
 */
export type PurchaseErrorKind = 'cancelled' | 'deferred' | 'network' | 'not_allowed' | 'store' | 'unknown';

const BY_CODE: Record<string, PurchaseErrorKind> = {
  '1': 'cancelled', // PURCHASE_CANCELLED_ERROR
  '20': 'deferred', // PAYMENT_PENDING_ERROR (Ask to Buy, paiement différé)
  '10': 'network', // NETWORK_ERROR
  '35': 'network', // OFFLINE_CONNECTION_ERROR
  '32': 'network', // PRODUCT_REQUEST_TIMED_OUT_ERROR
  '3': 'not_allowed', // PURCHASE_NOT_ALLOWED_ERROR (restrictions, Temps d'écran)
  '19': 'not_allowed', // INSUFFICIENT_PERMISSIONS_ERROR
  '2': 'store', // STORE_PROBLEM_ERROR
  '5': 'store', // PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR
  '23': 'store', // CONFIGURATION_ERROR
  '24': 'store', // UNSUPPORTED_ERROR
};

export function purchaseErrorKind(e: unknown): PurchaseErrorKind {
  const err = (e ?? {}) as { userCancelled?: boolean | null; code?: string | number | null; message?: string };
  if (err.userCancelled) return 'cancelled';
  const byCode = err.code != null ? BY_CODE[String(err.code)] : undefined;
  if (byCode) return byCode;
  const msg = String(err.message ?? '').toLowerCase();
  if (/network|offline|internet|timed? ?out|failed to fetch/.test(msg)) return 'network';
  return 'unknown';
}

/** Erreur d'achat déjà classée (lancée par purchase()) : l'interface affiche le message de sa catégorie. */
export class PurchaseError extends Error {
  constructor(public kind: PurchaseErrorKind, cause?: unknown) {
    super((cause as { message?: string } | null)?.message ?? kind);
    this.name = 'PurchaseError';
  }
}
