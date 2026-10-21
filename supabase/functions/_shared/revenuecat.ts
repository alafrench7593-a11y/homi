/**
 * Événement RevenueCat → ligne de la table `subscriptions` (logique pure, testée par Jest : src/__tests__/premium.test.ts).
 * Fin d'essai, renouvellement, annulation (droits jusqu'à l'échéance), problème de paiement (grâce puis pause),
 * expiration. Les événements arrivés en retard ne remplacent jamais un état plus récent.
 */
export type RcEvent = {
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string;
  period_type?: string;
  store?: string;
  environment?: string;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
};

export function mapStatus(type: string, expiresAt: number | null, now: number = Date.now()): string {
  const expired = expiresAt != null && expiresAt < now;
  switch (type) {
    case 'EXPIRATION': return 'expired';
    case 'BILLING_ISSUE': return expired ? 'billing_issue' : 'grace';
    case 'CANCELLATION': return expired ? 'expired' : 'cancelled';
    case 'SUBSCRIPTION_PAUSED': return 'expired';
    default: return expired ? 'expired' : 'active'; // INITIAL_PURCHASE, RENEWAL, UNCANCELLATION, PRODUCT_CHANGE…
  }
}

export function subscriptionFromEvent(event: RcEvent, expiresAt: number | null, productId: string | null, entitlement: string, now: number = Date.now()) {
  const base = mapStatus(event.type, expiresAt, now);
  const status = event.period_type === 'TRIAL' && base === 'active' ? 'trial' : base;
  const store = event.environment === 'SANDBOX' ? 'test'
    : event.store === 'APP_STORE' ? 'app_store'
    : event.store === 'PLAY_STORE' ? 'play_store'
    : event.store === 'PROMOTIONAL' ? 'promotional' : null;
  const period = event.period_type === 'TRIAL' ? 'trial' : /annual|year|annuel/i.test(productId ?? '') ? 'annual' : 'monthly';
  return {
    entitlement,
    status,
    product_id: productId,
    store,
    period_type: period,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    will_renew: !['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'SUBSCRIPTION_PAUSED'].includes(event.type),
    last_event: event.type,
    last_event_at: new Date(event.event_timestamp_ms ?? now).toISOString(),
  };
}

/** Un événement plus ancien que le dernier traité est ignoré (RevenueCat peut renvoyer des événements dans le désordre). */
export const isStale = (event: RcEvent, lastEventAt: string | null | undefined) =>
  !!lastEventAt && event.event_timestamp_ms != null && event.event_timestamp_ms < Date.parse(lastEventAt);
