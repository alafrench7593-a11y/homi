/**
 * RevenueCat → ligne de la table `subscriptions` (logique pure, sans dépendance Deno : testée par Jest
 * — src/__tests__/premium.test.ts, src/__tests__/subscriptionScenarios.test.ts — et par Deno).
 *
 * Deux sources, même résultat :
 *  - un événement de webhook (subscriptionFromEvent) ;
 *  - la fiche abonné de l'API REST v1 (subscriptionFromSubscriber), qui fait foi quand la clé secrète est configurée
 *    (recommandation RevenueCat : relire GET /subscribers après chaque webhook).
 * Références : https://www.revenuecat.com/docs/event-types-and-fields
 *              https://www.revenuecat.com/docs/api-v1/customers
 *
 * Règles :
 *  - remboursement (CANCELLATION / EXPIRATION avec la raison CUSTOMER_SUPPORT) → « refunded » : droits retirés tout de suite ;
 *  - SUBSCRIPTION_PAUSED (Google Play) : pause programmée à la FIN de la période → droits jusqu'à l'échéance
 *    (« paused »), retirés à l'EXPIRATION de raison SUBSCRIPTION_PAUSED (doc RevenueCat : ne pas retirer l'accès avant) ;
 *  - échéance inconnue : jamais de Premium sans fin (la base n'accorde une échéance nulle qu'à un octroi
 *    promotionnel ou à vie explicite) ;
 *  - les événements arrivés en retard ne remplacent jamais un état plus récent.
 */

export const DEFAULT_ENTITLEMENT = 'AU_FIL_DE_NOUS_PREMIUM';

/** Identifiants des produits (App Store ; Google Play : mêmes identifiants, ou « abonnement:offre-de-base »). */
export const PRODUCT_IDS = {
  monthly: 'aufildenous_premium_monthly',
  six_months: 'aufildenous_premium_6months',
  annual: 'aufildenous_premium_annual',
} as const;

export type SubStatus = 'none' | 'trial' | 'active' | 'grace' | 'cancelled' | 'expired' | 'billing_issue' | 'refunded' | 'paused';
export type SubPeriod = 'monthly' | 'six_months' | 'annual' | 'trial' | 'lifetime';
export type SubStore = 'app_store' | 'play_store' | 'test' | 'promotional';

export type RcEvent = {
  type: string;
  id?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  new_product_id?: string;
  entitlement_ids?: string[] | null;
  entitlement_id?: string | null;
  period_type?: string;
  store?: string;
  environment?: string;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
  cancel_reason?: string;
  expiration_reason?: string;
  auto_resume_at_ms?: number | null;
  price?: number | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  is_trial_conversion?: boolean;
  transferred_from?: string[];
  transferred_to?: string[];
};

/** Ligne écrite dans `subscriptions` (les champs absents ne sont pas modifiés par l'upsert). */
export interface SubscriptionRow {
  entitlement: string;
  status: SubStatus;
  product_id?: string | null;
  store?: SubStore | null;
  period_type?: SubPeriod | null;
  expires_at: string | null;
  will_renew: boolean;
  started_at?: string | null;
  trial_ends_at?: string | null;
  price?: number | null;
  currency?: string | null;
  cancel_reason?: string | null;
  refunded_at?: string | null;
  billing_issue_at?: string | null;
  resumes_at?: string | null;
  environment?: 'production' | 'sandbox' | null;
  last_event?: string;
  last_event_at?: string;
  last_sync_at?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);
const iso = (ms: number | null | undefined) => (ms == null || !Number.isFinite(ms) ? null : new Date(ms).toISOString());
const parse = (s: string | null | undefined) => (s ? Date.parse(s) : null);

/**
 * Formule d'après la période ISO 8601 (P1M, P6M, P1Y) ou l'identifiant du produit. Google Play : « abonnement:offre-de-base »
 * (l'offre de base est examinée d'abord : 1 abonnement avec 3 offres de base OU 3 abonnements distincts).
 */
export function periodOf(productId?: string | null, isoPeriod?: string | null): Exclude<SubPeriod, 'trial'> | null {
  const p = (isoPeriod ?? '').toUpperCase();
  if (p === 'P1M' || p === 'P4W') return 'monthly';
  if (p === 'P6M') return 'six_months';
  if (p === 'P1Y' || p === 'P12M') return 'annual';
  const parts = (productId ?? '').toLowerCase().split(':').reverse();
  for (const part of parts) {
    if (/(six|6)[_-]?(months?|mois)|semest|half[_-]?year|p6m/.test(part)) return 'six_months';
    if (/annual|year|annuel|12[_-]?(months?|mois)|p1y/.test(part)) return 'annual';
    if (/month|mensuel|p1m/.test(part)) return 'monthly';
    if (/lifetime|a[_-]?vie/.test(part)) return 'lifetime';
  }
  return null;
}

export function storeOf(store?: string | null): SubStore | null {
  switch ((store ?? '').toUpperCase()) {
    case 'APP_STORE': case 'MAC_APP_STORE': return 'app_store';
    case 'PLAY_STORE': return 'play_store';
    case 'PROMOTIONAL': return 'promotional';
    case 'TEST_STORE': return 'test';
    default: return null;
  }
}

/** L'événement concerne-t-il notre droit ? (entitlement_ids absent : on ne peut pas savoir → oui ; liste sans lui → non) */
export function concernsEntitlement(event: RcEvent, entitlement: string): boolean {
  if (event.type === 'TRANSFER' || event.type === 'TEST' || event.type === 'TEMPORARY_ENTITLEMENT_GRANT') return true;
  if (Array.isArray(event.entitlement_ids)) return event.entitlement_ids.includes(entitlement);
  if (event.entitlement_ids === null) return false; // le produit ne donne aucun droit
  if (typeof event.entitlement_id === 'string') return event.entitlement_id === entitlement;
  return true;
}

/** Identifiant Supabase de la personne (appUserID = id Supabase ; jamais un identifiant anonyme RevenueCat). */
export function eventUserId(event: RcEvent): string | null {
  return [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].find(isUuid) ?? null;
}

/** TRANSFER : pas d'app_user_id ; transferred_from / transferred_to (doc RevenueCat). */
export function transferIds(event: RcEvent): { from: string[]; to: string[] } {
  return { from: (event.transferred_from ?? []).filter(isUuid), to: (event.transferred_to ?? []).filter(isUuid) };
}

export const isRefund = (event: RcEvent) =>
  (event.type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT')
  || (event.type === 'EXPIRATION' && event.expiration_reason === 'CUSTOMER_SUPPORT');

export function mapStatus(type: string, expiresAt: number | null, now: number = Date.now(), event: Partial<RcEvent> = {}): SubStatus {
  const expired = expiresAt != null && expiresAt <= now;
  switch (type) {
    case 'CANCELLATION':
      if (event.cancel_reason === 'CUSTOMER_SUPPORT') return 'refunded';
      if (event.cancel_reason === 'BILLING_ERROR') return expired || expiresAt == null ? 'billing_issue' : 'grace';
      return expired ? 'expired' : 'cancelled';
    case 'EXPIRATION':
      if (event.expiration_reason === 'CUSTOMER_SUPPORT') return 'refunded';
      if (event.expiration_reason === 'SUBSCRIPTION_PAUSED') return 'paused';
      if (event.expiration_reason === 'BILLING_ERROR') return 'billing_issue';
      return 'expired';
    case 'BILLING_ISSUE': return expired || expiresAt == null ? 'billing_issue' : 'grace';
    case 'SUBSCRIPTION_PAUSED': return 'paused'; // pause à la fin de la période : droits jusqu'à l'échéance
    default:
      // INITIAL_PURCHASE, RENEWAL, UNCANCELLATION, PRODUCT_CHANGE, SUBSCRIPTION_EXTENDED, REFUND_REVERSED,
      // NON_RENEWING_PURCHASE, TEMPORARY_ENTITLEMENT_GRANT
      if (expired) return 'expired';
      return event.period_type === 'TRIAL' ? 'trial' : 'active';
  }
}

const NO_RENEW = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'SUBSCRIPTION_PAUSED', 'NON_RENEWING_PURCHASE']);
const REACTIVATE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'REFUND_REVERSED']);

/** Événement de webhook → ligne (sans relecture de l'API). */
export function subscriptionFromEvent(event: RcEvent, expiresAt: number | null, productId: string | null, entitlement: string, now: number = Date.now()): SubscriptionRow {
  // Octroi temporaire (panne de validation de la boutique) : 24 h au plus d'après la doc RevenueCat
  const exp = event.type === 'TEMPORARY_ENTITLEMENT_GRANT' && expiresAt == null ? now + 24 * 3_600_000 : expiresAt;
  const status = mapStatus(event.type, exp, now, event);
  const store = storeOf(event.store);
  const at = iso(event.event_timestamp_ms ?? now)!;
  const plan = periodOf(productId) ?? (exp == null && store === 'promotional' ? 'lifetime' : null);
  const row: SubscriptionRow = {
    entitlement,
    status,
    product_id: productId,
    store,
    period_type: plan,
    expires_at: iso(exp),
    will_renew: !NO_RENEW.has(event.type) && status !== 'refunded' && status !== 'expired',
    last_event: event.type,
    last_event_at: at,
  };
  if (event.environment) row.environment = event.environment === 'SANDBOX' ? 'sandbox' : 'production';
  if (event.type === 'INITIAL_PURCHASE' && event.purchased_at_ms) row.started_at = iso(event.purchased_at_ms);
  if (event.period_type === 'TRIAL' && exp != null) row.trial_ends_at = iso(exp);
  const paid = event.price_in_purchased_currency;
  if (typeof paid === 'number' && paid > 0 && event.currency && /^[A-Z]{3}$/.test(event.currency)) {
    row.price = Math.round(paid * 100) / 100;
    row.currency = event.currency;
  }
  if (event.type === 'CANCELLATION' || event.type === 'EXPIRATION') row.cancel_reason = (event.cancel_reason ?? event.expiration_reason ?? null)?.slice(0, 40) ?? null;
  if (REACTIVATE.has(event.type)) { row.cancel_reason = null; row.billing_issue_at = null; row.resumes_at = null; }
  if (status === 'refunded') row.refunded_at = at;
  if (event.type === 'REFUND_REVERSED' || event.type === 'INITIAL_PURCHASE') row.refunded_at = null;
  if (event.type === 'BILLING_ISSUE') row.billing_issue_at = at;
  if (event.type === 'SUBSCRIPTION_PAUSED') row.resumes_at = iso(event.auto_resume_at_ms ?? null);
  return row;
}

/** Fiche abonné de l'API REST v1 (GET /v1/subscribers/{id}) — sous-ensemble utilisé. */
export interface RcSubscriberBody {
  subscriber?: {
    original_app_user_id?: string;
    entitlements?: Record<string, { expires_date?: string | null; grace_period_expires_date?: string | null; product_identifier?: string; purchase_date?: string }>;
    subscriptions?: Record<string, {
      expires_date?: string | null; purchase_date?: string; original_purchase_date?: string; period_type?: string; store?: string;
      is_sandbox?: boolean; unsubscribe_detected_at?: string | null; billing_issues_detected_at?: string | null; refunded_at?: string | null;
      auto_resume_date?: string | null; grace_period_expires_date?: string | null;
    }>;
  };
}

/**
 * Fiche abonné → ligne. Renvoie null si la réponse n'a pas la forme attendue.
 * `latestPurchaseAt` sert à ne pas annuler un remboursement avec une fiche antérieure à ce remboursement.
 */
export function subscriptionFromSubscriber(body: RcSubscriberBody | null | undefined, entitlement: string, now: number = Date.now()): { row: SubscriptionRow; latestPurchaseAt: number | null } | null {
  const sub = body?.subscriber;
  if (!sub || typeof sub !== 'object') return null;
  const ent = sub.entitlements?.[entitlement];
  const nowIso = new Date(now).toISOString();
  if (!ent) {
    return { row: { entitlement, status: 'none', expires_at: null, will_renew: false, last_sync_at: nowIso }, latestPurchaseAt: null };
  }
  const pid = ent.product_identifier ?? null;
  const subs = sub.subscriptions ?? {};
  const s = (pid && (subs[pid] ?? subs[pid.split(':')[0]])) || {};
  const exp = parse(ent.expires_date ?? null);
  const grace = parse(ent.grace_period_expires_date ?? s.grace_period_expires_date ?? null);
  const effective = exp == null ? null : Math.max(exp, grace ?? 0);
  const store = storeOf(s.store ?? null);
  const trial = (s.period_type ?? '').toLowerCase() === 'trial';
  let status: SubStatus;
  if (s.refunded_at) status = 'refunded';
  else if (effective == null) status = 'active'; // droit sans échéance donné par RevenueCat (promotionnel / à vie)
  else if (effective <= now) status = s.auto_resume_date ? 'paused' : s.billing_issues_detected_at ? 'billing_issue' : 'expired';
  else if (s.billing_issues_detected_at) status = 'grace';
  else if (trial) status = 'trial';
  else if (s.unsubscribe_detected_at) status = 'cancelled';
  else if (s.auto_resume_date) status = 'paused';
  else status = 'active';
  const plan = periodOf(pid) ?? (effective == null ? 'lifetime' : null);
  const row: SubscriptionRow = {
    entitlement,
    status,
    product_id: pid,
    store,
    period_type: plan,
    expires_at: effective == null ? null : new Date(effective).toISOString(),
    will_renew: ['active', 'trial', 'grace'].includes(status) && !s.unsubscribe_detected_at,
    started_at: s.original_purchase_date ?? ent.purchase_date ?? null,
    refunded_at: s.refunded_at ?? null,
    billing_issue_at: s.billing_issues_detected_at ?? null,
    resumes_at: s.auto_resume_date ?? null,
    environment: s.is_sandbox == null ? null : s.is_sandbox ? 'sandbox' : 'production',
    last_sync_at: nowIso,
  };
  if (trial && exp != null) row.trial_ends_at = new Date(exp).toISOString();
  return { row, latestPurchaseAt: parse(s.purchase_date ?? ent.purchase_date ?? null) };
}

/** Un événement plus ancien que le dernier traité est ignoré (RevenueCat peut renvoyer des événements dans le désordre). */
export const isStale = (event: RcEvent, lastEventAt: string | null | undefined) =>
  !!lastEventAt && event.event_timestamp_ms != null && event.event_timestamp_ms < Date.parse(lastEventAt);

/**
 * Même événement reçu une seconde fois (RevenueCat réessaie tant qu'il n'a pas reçu de réponse 200) :
 * même type et même horodatage que le dernier traité → rien à refaire (ni écriture, ni notification en double).
 */
export const isDuplicate = (event: RcEvent, last: { last_event?: string | null; last_event_at?: string | null } | null | undefined) =>
  !!last?.last_event_at && last.last_event === event.type && event.event_timestamp_ms != null
  && event.event_timestamp_ms === Date.parse(last.last_event_at);

/** Notification in-app, en français ou en anglais selon la langue du profil (français par défaut). */
const NOTICES = {
  fr: {
    billing: ['Problème de paiement', 'Votre abonnement n’a pas pu être renouvelé. Vérifiez votre moyen de paiement dans l’App Store ou Google Play.'],
    expired: ['Abonnement terminé', 'Votre abonnement Au fil de nous Premium a pris fin. Vos données et les fonctions essentielles restent disponibles.'],
    cancelled: ['Renouvellement désactivé', 'Votre abonnement reste actif jusqu’à sa date d’échéance, puis ne sera pas renouvelé.'],
    refunded: ['Abonnement remboursé', 'Votre abonnement a été remboursé : l’accès Premium a pris fin. Vos données restent disponibles.'],
    paused: ['Abonnement en pause', 'Votre abonnement sera mis en pause à la fin de la période en cours. Premium reste disponible jusque-là.'],
  },
  en: {
    billing: ['Payment issue', 'Your subscription could not be renewed. Please check your payment method in the App Store or Google Play.'],
    expired: ['Subscription ended', 'Your Au fil de nous Premium subscription has ended. Your data and essential features remain available.'],
    cancelled: ['Auto-renewal turned off', 'Your subscription stays active until its end date and will not renew.'],
    refunded: ['Subscription refunded', 'Your subscription was refunded: Premium access has ended. Your data remains available.'],
    paused: ['Subscription paused', 'Your subscription will be paused at the end of the current period. Premium remains available until then.'],
  },
  es: {
    billing: ['Problema con el pago', 'No se ha podido renovar tu suscripción. Comprueba tu método de pago en el App Store o Google Play.'],
    expired: ['Suscripción finalizada', 'Tu suscripción a Au fil de nous Premium ha finalizado. Tus datos y las funciones esenciales siguen disponibles.'],
    cancelled: ['Renovación desactivada', 'Tu suscripción sigue activa hasta su fecha de vencimiento y después no se renovará.'],
    refunded: ['Suscripción reembolsada', 'Tu suscripción ha sido reembolsada: el acceso Premium ha finalizado. Tus datos siguen disponibles.'],
    paused: ['Suscripción en pausa', 'Tu suscripción se pausará al final del periodo actual. Premium sigue disponible hasta entonces.'],
  },
  de: {
    billing: ['Zahlungsproblem', 'Dein Abo konnte nicht verlängert werden. Prüfe deine Zahlungsmethode im App Store oder bei Google Play.'],
    expired: ['Abo beendet', 'Dein Abo für Au fil de nous Premium ist beendet. Deine Daten und die wichtigsten Funktionen bleiben verfügbar.'],
    cancelled: ['Verlängerung deaktiviert', 'Dein Abo bleibt bis zum Ablaufdatum aktiv und wird danach nicht verlängert.'],
    refunded: ['Abo erstattet', 'Dein Abo wurde erstattet: Der Premium-Zugang ist beendet. Deine Daten bleiben verfügbar.'],
    paused: ['Abo pausiert', 'Dein Abo wird am Ende des aktuellen Zeitraums pausiert. Premium bleibt bis dahin verfügbar.'],
  },
  it: {
    billing: ['Problema di pagamento', 'Non è stato possibile rinnovare il tuo abbonamento. Controlla il metodo di pagamento nell’App Store o su Google Play.'],
    expired: ['Abbonamento terminato', 'Il tuo abbonamento Au fil de nous Premium è terminato. I tuoi dati e le funzioni essenziali restano disponibili.'],
    cancelled: ['Rinnovo disattivato', 'Il tuo abbonamento resta attivo fino alla data di scadenza, poi non verrà rinnovato.'],
    refunded: ['Abbonamento rimborsato', 'Il tuo abbonamento è stato rimborsato: l’accesso Premium è terminato. I tuoi dati restano disponibili.'],
    paused: ['Abbonamento in pausa', 'Il tuo abbonamento verrà messo in pausa alla fine del periodo in corso. Premium resta disponibile fino ad allora.'],
  },
} as const;

export function noticeFor(event: RcEvent, status: SubStatus, locale: string | null | undefined): { title: string; body: string } | null {
  const lang = locale === 'en' || locale === 'es' || locale === 'de' || locale === 'it' ? locale : 'fr';
  const key = status === 'refunded' ? 'refunded'
    : event.type === 'BILLING_ISSUE' ? 'billing'
    : event.type === 'EXPIRATION' ? 'expired'
    : event.type === 'SUBSCRIPTION_PAUSED' ? 'paused'
    : event.type === 'CANCELLATION' && status === 'cancelled' ? 'cancelled'
    : event.type === 'CANCELLATION' && (status === 'grace' || status === 'billing_issue') ? 'billing'
    : null;
  if (!key) return null;
  const [title, body] = NOTICES[lang][key];
  return { title, body };
}

/** Droit acheté autre que le Premium (Assistant IA, outils à vie) — copie de RevenueCat dans entitlement_grants. */
export interface GrantRow { entitlement: string; product_id: string | null; store: string | null; active: boolean; expires_at: string | null }

/**
 * Tous les droits de la fiche RevenueCat SAUF le Premium (géré par `subscriptions`). Actif si sans échéance (achat à vie)
 * ou échéance (période de grâce comprise) future, et jamais s'il a été remboursé. Noms de droits invalides ignorés.
 */
export function grantsFromSubscriber(body: RcSubscriberBody | null | undefined, premiumEntitlement: string, now: number = Date.now()): GrantRow[] | null {
  const sub = body?.subscriber;
  if (!sub || typeof sub !== 'object') return null;
  const out: GrantRow[] = [];
  for (const [name, ent] of Object.entries(sub.entitlements ?? {})) {
    if (name === premiumEntitlement || !/^[A-Z0-9_]{3,64}$/.test(name) || !ent || typeof ent !== 'object') continue;
    const pid = ent.product_identifier ?? null;
    const s = (pid && ((sub.subscriptions ?? {})[pid] ?? (sub.subscriptions ?? {})[pid.split(':')[0]])) || {};
    const exp = parse(ent.expires_date ?? null);
    const grace = parse(ent.grace_period_expires_date ?? s.grace_period_expires_date ?? null);
    const effective = exp == null ? null : Math.max(exp, grace ?? 0);
    const active = !s.refunded_at && (effective == null || effective > now);
    out.push({ entitlement: name, product_id: pid, store: storeOf(s.store ?? null), active, expires_at: effective == null ? null : new Date(effective).toISOString() });
  }
  return out;
}
