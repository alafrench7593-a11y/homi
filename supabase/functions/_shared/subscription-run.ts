/**
 * Abonnements côté serveur (Deno) : webhook RevenueCat, resynchronisation à la demande (subscription-sync) et
 * suppression du client RevenueCat avec le compte. Dépendances injectées (base, API RevenueCat, horloge) :
 * testées sans réseau par subscription-run_test.ts.
 *
 * API REST RevenueCat v1 (clé SECRÈTE, serveur uniquement — jamais dans l'application) :
 *   GET    https://api.revenuecat.com/v1/subscribers/{app_user_id}   (crée la fiche si elle n'existe pas)
 *   DELETE https://api.revenuecat.com/v1/subscribers/{app_user_id}   (suppression asynchrone ; 404 = déjà supprimé)
 *   https://www.revenuecat.com/docs/api-v1/customers
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { json, safeEqual } from './http.ts';
import {
  concernsEntitlement, DEFAULT_ENTITLEMENT, eventUserId, grantsFromSubscriber, isDuplicate, isRefund, isStale, noticeFor, subscriptionFromEvent,
  subscriptionFromSubscriber, transferIds, type GrantRow, type RcEvent, type RcSubscriberBody, type SubscriptionRow,
} from './revenuecat.ts';
import { grantFor, packActionFor, type CreditPackId, type GrantAction } from './credits.ts';
import { firstBillingOf, type FirstBilling } from './conversion.ts';
import { ambassadorActionFor, type AmbassadorAction } from './ambassador.ts';

const RC_API = 'https://api.revenuecat.com/v1/subscribers/';
const PREMIUM_STATUSES = new Set(['trial', 'active', 'grace', 'cancelled', 'paused']);
const MAX_BODY = 64 * 1024;

export const entitlementId = (v: string | undefined = Deno.env.get('REVENUECAT_ENTITLEMENT')) => (v ?? '').trim() || DEFAULT_ENTITLEMENT;

export type StoredRow = Partial<SubscriptionRow> & { user_id: string };

/** Accès à la table `subscriptions` et aux notifications (client service_role en production). */
export interface SubscriptionDb {
  read(userId: string): Promise<StoredRow | null>;
  write(row: StoredRow): Promise<boolean>;
  notify(userId: string, notice: { title: string; body: string }): Promise<void>;
  locale(userId: string): Promise<string | null>;
  premium(userId: string): Promise<boolean>;
  /** Droits achetés hors Premium (Assistant IA, outils à vie) : remplace l'état connu de la personne. */
  writeGrants?(userId: string, grants: GrantRow[]): Promise<boolean>;
  /** Événement serveur first_billing_confirmed (conversion_events, idempotent sur la transaction). */
  recordConversion?(userId: string, e: FirstBilling): Promise<void>;
  /** Programme Ambassadeurs : commission d'un paiement réel, annulation d'un remboursement (jamais bloquant) */
  ambassador?(userId: string, a: NonNullable<AmbassadorAction>): Promise<void>;
}

/** Grand livre des crédits IA (RPC service_role : 20261126000100_credits_ia.sql). Toutes les écritures sont idempotentes. */
export interface CreditsLedger {
  grantMonthly(userId: string, g: GrantAction): Promise<boolean>;
  purchase(userId: string, productId: CreditPackId, transactionId: string): Promise<boolean>;
  /** 'not_found' : achat inconnu (jamais crédité) — rien à retirer. */
  refund(transactionId: string): Promise<'ok' | 'not_found' | 'error'>;
}

export function supabaseCredits(admin: SupabaseClient): CreditsLedger {
  const ok = (r: { data: unknown; error: unknown }) => !r.error && (r.data as { ok?: boolean } | null)?.ok === true;
  return {
    async grantMonthly(userId, g) {
      const r = await admin.rpc('credits_grant_monthly', { p_payer: userId, p_tier: g.tier, p_period_end: g.periodEnd, p_trial: g.trial, p_idempotency_key: g.key, p_source: 'revenuecat' });
      if (!ok(r)) console.error('credits_grant_error', (r.error as { code?: string } | null)?.code ?? 'refused');
      return ok(r);
    },
    async purchase(userId, productId, transactionId) {
      const r = await admin.rpc('credits_purchase', { p_user: userId, p_product: productId, p_transaction_id: transactionId, p_source: 'revenuecat' });
      if (!ok(r)) console.error('credits_purchase_error', (r.error as { code?: string } | null)?.code ?? 'refused');
      return ok(r);
    },
    async refund(transactionId) {
      const r = await admin.rpc('credits_refund_purchase', { p_transaction_id: transactionId, p_source: 'revenuecat' });
      if (ok(r)) return 'ok';
      if (!r.error && (r.data as { error?: string } | null)?.error === 'not_found') return 'not_found';
      console.error('credits_refund_error', (r.error as { code?: string } | null)?.code ?? 'refused');
      return 'error';
    },
  };
}

export interface RevenueCatApi {
  subscriber(userId: string): Promise<{ ok: true; body: RcSubscriberBody } | { ok: false; status: number }>;
  remove(userId: string): Promise<{ ok: boolean; status: number }>;
}

export function revenueCatApi(secretKey: string, fetchImpl: typeof fetch = fetch): RevenueCatApi {
  const headers = { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' };
  return {
    async subscriber(userId) {
      // Pas d'en-tête X-Platform : lecture « informative », sans modifier last_seen (doc RevenueCat)
      const res = await fetchImpl(RC_API + encodeURIComponent(userId), { headers, signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (!res) return { ok: false, status: 0 };
      if (!res.ok) return { ok: false, status: res.status };
      const body = await res.json().catch(() => null);
      return body ? { ok: true, body } : { ok: false, status: 502 };
    },
    async remove(userId) {
      const res = await fetchImpl(RC_API + encodeURIComponent(userId), { method: 'DELETE', headers, signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (!res) return { ok: false, status: 0 };
      await res.body?.cancel().catch(() => undefined);
      return { ok: res.ok || res.status === 404, status: res.status };
    },
  };
}

/** Implémentation Supabase (service_role : contourne la RLS ; n'est utilisée qu'après vérification). */
export function supabaseDb(admin: SupabaseClient): SubscriptionDb {
  return {
    async read(userId) {
      const { data } = await admin.from('subscriptions').select('*').eq('user_id', userId).maybeSingle();
      return (data as StoredRow | null) ?? null;
    },
    async write(row) {
      // `tier` est une colonne générée (d'après product_id) : jamais écrite
      const { tier: _tier, ...rest } = row as StoredRow & { tier?: unknown };
      const { error } = await admin.from('subscriptions').upsert({ ...rest, updated_at: new Date().toISOString() });
      if (error) console.error('subscription_upsert_error', error.code);
      return !error;
    },
    async notify(userId, n) {
      await admin.from('notifications').insert({ user_id: userId, category: 'subscription', title: n.title, body: n.body, deep_link: '/settings/subscription' });
    },
    async locale(userId) {
      const { data } = await admin.from('profiles').select('locale').eq('id', userId).maybeSingle();
      return (data as { locale?: string } | null)?.locale ?? null;
    },
    async premium(userId) {
      const { data } = await admin.rpc('_premium_of', { p_user: userId });
      return data === true;
    },
    async ambassador(userId, a) {
      // Règles et calcul dans la base (public._ambassador_accrue / _ambassador_reverse, migration 20261210000100)
      let t: { reference?: { vat_rate?: number; store_fee_rate?: number } } | null = null;
      if (a.kind === 'accrue' && (a.vatRate == null || a.storeFeeRate == null)) {
        const r = await admin.from('ambassador_terms_public').select('reference').maybeSingle();
        t = (r.data as typeof t) ?? null;
      }
      const { error } = a.kind === 'reverse'
        ? await admin.rpc('_ambassador_reverse', { p_transaction: a.transaction, p_reason: 'refund' })
        : await admin.rpc('_ambassador_accrue', { p_user: userId, p_transaction: a.transaction, p_product: a.product, p_price_cents: a.priceCents,
            p_currency: a.currency, p_vat_rate: a.vatRate ?? t?.reference?.vat_rate ?? 0, p_store_fee_rate: a.storeFeeRate ?? t?.reference?.store_fee_rate ?? 0, p_at: a.at });
      if (error) console.error('ambassador_error', error.code);
    },
    async recordConversion(userId, e) {
      // Contrainte unique (kind, transaction_id) : un webhook rejoué n'écrit jamais deux fois (migration 20261203000100)
      const { error } = await admin.from('conversion_events').upsert({ user_id: userId, ...e }, { onConflict: 'kind,transaction_id', ignoreDuplicates: true });
      if (error) console.error('conversion_event_error', error.code);
    },
    async writeGrants(userId, grants) {
      const at = new Date().toISOString();
      if (grants.length) {
        const { error } = await admin.from('entitlement_grants').upsert(grants.map((g) => ({ ...g, user_id: userId, updated_at: at })));
        if (error) { console.error('grants_upsert_error', error.code); return false; }
      }
      // Droits qui ne figurent plus chez RevenueCat (remboursés, transférés) : désactivés, jamais supprimés
      const keep = grants.map((g) => g.entitlement);
      let q = admin.from('entitlement_grants').update({ active: false, updated_at: at }).eq('user_id', userId).eq('active', true);
      if (keep.length) q = q.not('entitlement', 'in', `(${keep.join(',')})`);
      const { error } = await q;
      if (error) { console.error('grants_disable_error', error.code); return false; }
      return true;
    },
  };
}

/** Un remboursement enregistré n'est pas annulé par une fiche dont le dernier achat est antérieur au remboursement. */
function keepsRefund(current: StoredRow | null, next: SubscriptionRow, latestPurchaseAt: number | null): boolean {
  if (current?.status !== 'refunded' || !PREMIUM_STATUSES.has(next.status)) return false;
  const refundedAt = current.refunded_at ? Date.parse(current.refunded_at) : null;
  return refundedAt != null && (latestPurchaseAt == null || latestPurchaseAt <= refundedAt);
}

/** Copie les droits hors Premium d'une fiche RevenueCat (sans effet si la base ne le permet pas). */
async function writeGrantsFrom(userId: string, body: RcSubscriberBody, db: SubscriptionDb, entitlement: string, now: number) {
  const grants = grantsFromSubscriber(body, entitlement, now);
  if (grants && db.writeGrants) await db.writeGrants(userId, grants);
}

/** Relit la fiche RevenueCat et l'enregistre. */
async function syncFromApi(userId: string, api: RevenueCatApi, db: SubscriptionDb, entitlement: string, now: number, extra: Partial<SubscriptionRow> = {}) {
  const res = await api.subscriber(userId);
  if (!res.ok) return { ok: false as const, status: res.status };
  await writeGrantsFrom(userId, res.body, db, entitlement, now);
  const parsed = subscriptionFromSubscriber(res.body, entitlement, now);
  if (!parsed) return { ok: false as const, status: 502 };
  const current = await db.read(userId);
  let row: SubscriptionRow = { ...parsed.row, ...extra };
  if (keepsRefund(current, row, parsed.latestPurchaseAt)) row = { ...row, status: 'refunded', will_renew: false, refunded_at: current!.refunded_at };
  if (row.status === 'none' && !current) return { ok: true as const, row, written: false };
  const written = await db.write({ user_id: userId, ...row });
  return written ? { ok: true as const, row, written: true } : { ok: false as const, status: 500 };
}

export interface WebhookDeps {
  secret: string;
  entitlement: string;
  api: RevenueCatApi | null;
  db: SubscriptionDb;
  /** Crédits IA : packs consommables et octrois mensuels (absent : événements de packs refusés, octrois ignorés). */
  credits?: CreditsLedger | null;
  now?: () => number;
}

/** Octroi mensuel (idempotent) après un événement d'abonnement ; false : RevenueCat doit réessayer. */
async function grantCredits(event: RcEvent, row: Partial<SubscriptionRow>, userId: string, deps: WebhookDeps): Promise<boolean> {
  const g = grantFor(event, row, userId);
  if (!g || !deps.credits) return true;
  return deps.credits.grantMonthly(userId, g);
}

export async function handleWebhook(req: Request, deps: WebhookDeps): Promise<Response> {
  const now = deps.now?.() ?? Date.now();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!deps.secret) {
    console.error('revenuecat_webhook_secret_missing');
    return json({ error: 'not_configured' }, 500);
  }
  if (!safeEqual(req.headers.get('Authorization') ?? '', `Bearer ${deps.secret}`)) return json({ error: 'unauthorized' }, 401);
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'payload_too_large' }, 413);

  let event: RcEvent;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: 'payload_too_large' }, 413);
    event = JSON.parse(raw)?.event;
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!event || typeof event.type !== 'string') return json({ error: 'bad_request' }, 400);
  if (event.type === 'TEST') return json({ ok: true, test: true });

  // Packs de crédits consommables (aucun droit RevenueCat) : idempotence sur l'identifiant de transaction
  const pack = packActionFor(event);
  if (pack) {
    const uid = eventUserId(event);
    if (!uid) return json({ ok: true, ignored: 'anonymous_user' });
    if (!deps.credits) { console.error('credits_not_configured'); return json({ error: 'not_configured' }, 500); }
    if (pack.kind === 'purchase') {
      return (await deps.credits.purchase(uid, pack.productId, pack.transactionId)) ? json({ ok: true, credits: 'purchase' }) : json({ error: 'server_error' }, 500);
    }
    const r = await deps.credits.refund(pack.transactionId);
    if (r === 'error') return json({ error: 'server_error' }, 500);
    return json({ ok: true, credits: 'refund', ...(r === 'not_found' ? { ignored: 'unknown_purchase' } : {}) });
  }

  if (!concernsEntitlement(event, deps.entitlement)) {
    // Assistant IA, outils à vie : la fiche RevenueCat fait foi pour ces droits
    const uid = eventUserId(event);
    if (!uid || !deps.api) return json({ ok: true, ignored: 'other_entitlement' });
    const res = await deps.api.subscriber(uid);
    if (!res.ok) return json({ error: 'server_error' }, 500); // RevenueCat réessaiera
    await writeGrantsFrom(uid, res.body, deps.db, deps.entitlement, now);
    return json({ ok: true, grants: true });
  }

  if (event.type === 'TRANSFER') return handleTransfer(event, deps, now);

  const userId = eventUserId(event);
  if (!userId) return json({ ok: true, ignored: 'anonymous_user' }); // achat avant connexion : rattaché au logIn

  const current = await deps.db.read(userId);
  if (isStale(event, current?.last_event_at)) return json({ ok: true, ignored: 'stale_event' });
  if (isDuplicate(event, current)) {
    // Réessai après un échec de l'octroi : l'abonnement est déjà écrit, l'octroi (idempotent) est retenté
    if (current && !(await grantCredits(event, current, userId, deps))) return json({ error: 'server_error' }, 500);
    return json({ ok: true, ignored: 'duplicate_event' });
  }

  // Changement de formule : le produit effectif est relu dans l'API quand elle est disponible ; sinon, l'ancien
  // produit reste affiché jusqu'au RENEWAL du nouveau (un changement « différé » ne prend effet qu'à l'échéance).
  let row = subscriptionFromEvent(event, event.expiration_at_ms ?? null, event.product_id ?? null, deps.entitlement, now);
  if (deps.api) {
    const res = await deps.api.subscriber(userId);
    const parsed = res.ok ? subscriptionFromSubscriber(res.body, deps.entitlement, now) : null;
    if (res.ok) await writeGrantsFrom(userId, res.body, deps.db, deps.entitlement, now);
    if (parsed) {
      // L'API fait foi pour l'état et les dates ; l'événement apporte son type, sa date, sa raison et le prix payé
      row = {
        ...parsed.row,
        last_event: row.last_event, last_event_at: row.last_event_at,
        ...(row.cancel_reason !== undefined ? { cancel_reason: row.cancel_reason } : {}),
        ...(row.price !== undefined ? { price: row.price, currency: row.currency } : {}),
      };
      if (isRefund(event)) row = { ...row, status: 'refunded', will_renew: false, refunded_at: row.refunded_at ?? new Date(event.event_timestamp_ms ?? now).toISOString() };
      if (parsed.row.status === 'none' && !current) return json({ ok: true, ignored: 'no_entitlement' });
    } else {
      console.error('revenuecat_api_unavailable', res.ok ? 'shape' : res.status); // repli : contenu de l'événement
    }
  }

  if (!(await deps.db.write({ user_id: userId, ...row }))) return json({ error: 'server_error' }, 500); // RevenueCat réessaiera
  // Mesure du paywall : première facturation confirmée (après l'essai, ou achat payé tout de suite) — jamais bloquant
  const billing = firstBillingOf(event, current?.status);
  if (billing && deps.db.recordConversion) await deps.db.recordConversion(userId, billing).catch(() => undefined);
  // Programme Ambassadeurs : commission d'un paiement réel / annulation d'un remboursement — jamais bloquant
  const amb = ambassadorActionFor(event as RcEvent, now);
  if (amb && deps.db.ambassador) await deps.db.ambassador(userId, amb).catch(() => undefined);
  // Crédits mensuels : INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE vers Famille (jamais déclenchés par l'application)
  if (!(await grantCredits(event, row, userId, deps))) return json({ error: 'server_error' }, 500);

  const notice = noticeFor(event, row.status, await deps.db.locale(userId).catch(() => null));
  if (notice) await deps.db.notify(userId, notice).catch(() => undefined);
  return json({ ok: true, status: row.status });
}

/** TRANSFER : les achats passent d'un appUserID à un autre (même identifiant Apple / Google sur deux comptes). */
async function handleTransfer(event: RcEvent, deps: WebhookDeps, now: number): Promise<Response> {
  const { from, to } = transferIds(event);
  if (!from.length && !to.length) return json({ ok: true, ignored: 'anonymous_user' });
  const at = new Date(event.event_timestamp_ms ?? now).toISOString();
  const mark = { last_event: 'TRANSFER', last_event_at: at };
  if (deps.api) {
    for (const id of [...from, ...to]) {
      const r = await syncFromApi(id, deps.api, deps.db, deps.entitlement, now, mark);
      if (!r.ok) return json({ error: 'server_error' }, 500);
    }
    return json({ ok: true, transferred: to.length });
  }
  // Sans clé API : la ligne de l'ancien compte est recopiée sur le nouveau, l'ancien perd ses droits
  const source = from.length ? await deps.db.read(from[0]) : null;
  for (const id of to) {
    if (!source) continue;
    const { user_id: _old, tier: _tier, ...copy } = source as StoredRow & { tier?: unknown };
    if (!(await deps.db.write({ ...copy, user_id: id, ...mark }))) return json({ error: 'server_error' }, 500);
  }
  for (const id of from) {
    const cur = await deps.db.read(id);
    if (!cur) continue;
    if (!(await deps.db.write({ user_id: id, entitlement: cur.entitlement ?? deps.entitlement, status: 'expired', will_renew: false, expires_at: new Date(now).toISOString(), ...mark }))) {
      return json({ error: 'server_error' }, 500);
    }
  }
  return json({ ok: true, transferred: to.length });
}

export interface SyncDeps {
  userId: (req: Request) => Promise<string | null>;
  rateLimit: (userId: string) => Promise<boolean>;
  api: RevenueCatApi | null;
  entitlement: string;
  db: SubscriptionDb;
  now?: () => number;
}

/**
 * subscription-sync : la personne connectée demande au serveur de relire SON abonnement chez RevenueCat
 * (après un achat, une restauration, ou quand l'état de l'appareil diffère de celui du serveur).
 * Jamais d'identifiant dans la requête : seul celui du jeton de connexion est utilisé.
 */
export async function handleSync(req: Request, deps: SyncDeps): Promise<Response> {
  const now = deps.now?.() ?? Date.now();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const userId = await deps.userId(req);
  if (!userId) return json({ error: 'unauthorized', message: 'Connexion requise.' }, 401);
  if (!(await deps.rateLimit(userId))) return json({ synced: false, reason: 'rate_limited' }, 429);
  if (!deps.api) return json({ synced: false, reason: 'not_configured', premium: await deps.db.premium(userId) });
  const r = await syncFromApi(userId, deps.api, deps.db, deps.entitlement, now);
  if (!r.ok) {
    console.error('subscription_sync_error', r.status);
    return json({ synced: false, reason: 'unavailable' }, 502);
  }
  return json({ synced: true, status: r.row.status, premium: await deps.db.premium(userId) });
}

/** Suppression du compte : supprime aussi le client RevenueCat. Ne lève jamais d'erreur (ne bloque pas la suppression). */
export async function deleteRevenueCatCustomer(api: RevenueCatApi | null, userId: string): Promise<'deleted' | 'failed' | 'not_configured'> {
  if (!api) return 'not_configured';
  try {
    const r = await api.remove(userId);
    return r.ok ? 'deleted' : 'failed';
  } catch {
    return 'failed';
  }
}
