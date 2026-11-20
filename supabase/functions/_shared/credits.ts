/**
 * Crédits IA côté serveur — logique PURE (sans Deno ni client Supabase) : importée par les fonctions edge et testée par
 * Jest (src/__tests__/creditsServer.test.ts). Grand livre et règles : supabase/migrations/20261126000100_credits_ia.sql ;
 * documentation : docs/CREDITS_IA.md.
 *
 *  - produits : packs consommables homi_credits_300 | _800 | _2000, formule Famille homi_family_monthly ;
 *  - webhook RevenueCat → action sur le grand livre (achat, remboursement, octroi mensuel) ;
 *  - assistant : réserve AVANT l'appel à l'IA, débit seulement si le résultat a été LIVRÉ, restitution sinon
 *    (échec de l'IA, réponse bloquée, diffusion coupée). La sécurité ne passe jamais par ici.
 */

/** Packs consommables (identifiants proposés, à confirmer dans App Store Connect). */
export const CREDIT_PACK_IDS = ['homi_credits_300', 'homi_credits_800', 'homi_credits_2000'] as const;
export type CreditPackId = (typeof CREDIT_PACK_IDS)[number];
/** Crédits par pack (miroir du réglage serveur « packs » ; le serveur fait foi). */
export const PACK_CREDITS: Record<CreditPackId, number> = { homi_credits_300: 300, homi_credits_800: 800, homi_credits_2000: 2000 };
/** Offering RevenueCat des packs. */
export const CREDITS_OFFERING = 'credits';
/** Formule Famille : niveau supérieur du groupe d'abonnements « HOMI Premium » (identifiant proposé). */
export const FAMILY_PRODUCT_IDS = { monthly: 'homi_family_monthly' } as const;

export type Tier = 'premium' | 'family';

const base = (id: string | null | undefined) => (id ?? '').split(':')[0].trim().toLowerCase();
/** Formule d'un identifiant de produit — même règle que la colonne générée subscriptions.tier. */
export const tierOfProduct = (id: string | null | undefined): Tier => (base(id).startsWith('homi_family') ? 'family' : 'premium');
export const isCreditPack = (id: string | null | undefined): id is CreditPackId => (CREDIT_PACK_IDS as readonly string[]).includes(base(id));

/** Sous-ensemble d'un événement RevenueCat utile aux crédits. */
export interface CreditEvent {
  type: string;
  id?: string;
  product_id?: string;
  new_product_id?: string;
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  event_timestamp_ms?: number;
  cancel_reason?: string;
}

export type PackAction = { kind: 'purchase'; productId: CreditPackId; transactionId: string } | { kind: 'refund'; transactionId: string };

/** Identifiant de transaction d'un achat consommable (clé d'idempotence du grand livre). */
export function transactionIdOf(e: CreditEvent): string | null {
  const tx = e.transaction_id || e.original_transaction_id || e.id || null;
  return tx && /^[A-Za-z0-9:._-]{1,120}$/.test(tx) ? tx : null;
}

/**
 * Événement d'un pack consommable → achat ou remboursement. RevenueCat envoie NON_RENEWING_PURCHASE pour un
 * consommable (INITIAL_PURCHASE est accepté par prudence pour un consommable mal classé), et CANCELLATION quand Apple
 * ou Google rembourse l'achat. Tout autre événement d'un pack est ignoré.
 */
export function packActionFor(e: CreditEvent): PackAction | null {
  if (!isCreditPack(e.product_id)) return null;
  const tx = transactionIdOf(e);
  if (!tx) return null;
  if (e.type === 'NON_RENEWING_PURCHASE' || e.type === 'INITIAL_PURCHASE') return { kind: 'purchase', productId: base(e.product_id) as CreditPackId, transactionId: tx };
  if (e.type === 'CANCELLATION' || e.type === 'REFUND') return { kind: 'refund', transactionId: tx };
  return null;
}

export interface GrantAction { tier: Tier; trial: boolean; periodEnd: string | null; key: string }

/**
 * Octroi mensuel déclenché par un événement d'abonnement (jamais par l'application) : INITIAL_PURCHASE, RENEWAL, et
 * PRODUCT_CHANGE vers Famille. `row` = ligne d'abonnement qui vient d'être enregistrée (état et échéance qui font foi).
 * Clé d'idempotence : une même période (produit + échéance) n'est créditée qu'une fois, quel que soit le nombre de
 * réceptions de l'événement.
 */
export function grantFor(e: CreditEvent, row: { status?: string | null; product_id?: string | null; expires_at?: string | null }, userId: string): GrantAction | null {
  if (!['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE'].includes(e.type)) return null;
  if (row.status !== 'active' && row.status !== 'trial') return null;
  const product = row.product_id ?? e.product_id ?? null;
  if (isCreditPack(product)) return null;
  if (e.type === 'PRODUCT_CHANGE') {
    if (tierOfProduct(e.new_product_id) !== 'family') return null; // descente : prise en compte au renouvellement
    return { tier: 'family', trial: false, periodEnd: row.expires_at ?? null, key: `upgrade:${userId}:${e.id ?? e.event_timestamp_ms ?? 'x'}` };
  }
  const exp = row.expires_at ? Date.parse(row.expires_at) : NaN;
  return {
    tier: tierOfProduct(product),
    trial: row.status === 'trial',
    periodEnd: row.expires_at ?? null,
    key: `grant:${userId}:${base(product) || 'premium'}:${Number.isFinite(exp) ? exp : e.event_timestamp_ms ?? 'x'}`,
  };
}

// ---------------------------------------------------------------- réserve / débit / restitution (assistant, analyses)
export type ReserveResult =
  | { ok: true; reservation_id: string; cost: number; replay?: boolean; status?: string; monthly_remaining?: number; purchased_remaining?: number; next_renewal?: string | null }
  | { ok: false; error: string; cost?: number; monthly_remaining?: number; purchased_remaining?: number; next_renewal?: string | null };

/** Accès au grand livre (RPC service_role en production, double en mémoire dans les tests). */
export interface CreditsGate {
  reserve(action: string, idempotencyKey: string): Promise<ReserveResult>;
  commit(reservationId: string): Promise<boolean>;
  release(reservationId: string, reason: string): Promise<boolean>;
}

/** Clé d'idempotence d'une requête : identifiant fourni par l'application (même question renvoyée → même réserve). */
export function requestKey(prefix: string, userId: string, requestId: unknown): string {
  // Sans identifiant valide : identifiant unique de cette requête (aucune idempotence possible côté application)
  const g = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  const rid = typeof requestId === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(requestId) ? requestId
    : g?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}:${userId.slice(0, 8)}:${rid}`.slice(0, 120);
}

/** Réserve refusée → réponse HTTP pour l'application (aucune donnée sensible). */
export function reserveRefusal(r: ReserveResult): { status: number; body: Record<string, unknown> } | null {
  if (r.ok) {
    if (r.replay && r.status && r.status !== 'held') return { status: 409, body: { error: 'duplicate_request', message: 'Cette demande a déjà été traitée.' } };
    return null;
  }
  switch (r.error) {
    case 'insufficient_credits':
      return {
        status: 402,
        body: {
          error: 'insufficient_credits', message: 'Tu n’as plus assez de crédits pour cette action.', cost: r.cost ?? null,
          credits: { monthly_remaining: r.monthly_remaining ?? 0, purchased_remaining: r.purchased_remaining ?? 0, next_renewal: r.next_renewal ?? null },
        },
      };
    case 'premium_required':
      return { status: 402, body: { error: 'premium_required', message: 'L’assistant fait partie de HOMI Premium.' } };
    case 'ai_disabled':
      return { status: 503, body: { error: 'ai_disabled', message: 'L’IA est momentanément indisponible. Les outils restent disponibles.' } };
    default:
      return { status: 500, body: { error: 'server_error' } };
  }
}

/**
 * Règle une réserve : débit si le résultat a été livré, restitution sinon. Ne lève jamais (une restitution manquée est
 * rattrapée par l'expiration automatique des réserves orphelines).
 */
export async function settle(gate: CreditsGate, reservationId: string, delivered: boolean, reason: string): Promise<'committed' | 'released' | 'failed'> {
  try {
    if (delivered) return (await gate.commit(reservationId)) ? 'committed' : 'failed';
    return (await gate.release(reservationId, reason)) ? 'released' : 'failed';
  } catch {
    return 'failed';
  }
}

/** L'application a fermé la connexion pendant la diffusion. */
export class ClientGone extends Error {
  constructor() { super('client_gone'); this.name = 'ClientGone'; }
}

export type StreamOutcome = { done: unknown; charge?: boolean } | { error: Record<string, unknown> };

/**
 * Flux SSE facturé : `produce` diffuse (emit renvoie false si l'application est partie) et rend soit le résultat final
 * (« done »), soit une erreur. Débit SEULEMENT si l'événement « done » a été remis à une connexion encore ouverte ;
 * restitution si l'IA échoue, si la réponse est inutilisable, ou si la diffusion est coupée (défaut corrigé :
 * une question n'est plus décomptée malgré une coupure).
 */
export function billedSseStream(o: {
  encode: (event: string, data: unknown) => string;
  meta: unknown;
  produce: (emit: (event: string, data: unknown) => boolean) => Promise<StreamOutcome>;
  settle: (delivered: boolean, reason: string) => Promise<unknown>;
  onSettled?: (result: 'delivered' | 'released', reason: string) => void;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let gone = false;
  let settled = false;
  const finish = async (delivered: boolean, reason: string) => {
    if (settled) return;
    settled = true;
    await o.settle(delivered, reason);
    o.onSettled?.(delivered ? 'delivered' : 'released', reason);
  };
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: string, data: unknown): boolean => {
        if (gone) return false;
        try {
          controller.enqueue(encoder.encode(o.encode(event, data)));
          return true;
        } catch {
          gone = true;
          return false;
        }
      };
      try {
        emit('meta', o.meta);
        const out = await o.produce(emit);
        if ('done' in out) {
          const sent = emit('done', out.done);
          const delivered = sent && !gone;
          // charge: false → réponse de repli remise (réponse de l'IA bloquée ou vide) : jamais facturée
          await finish(delivered && out.charge !== false, !delivered ? 'stream_cut' : out.charge === false ? 'not_charged' : 'delivered');
        } else {
          emit('error', out.error);
          await finish(false, String(out.error.error ?? 'llm_error'));
        }
      } catch (e) {
        await finish(false, e instanceof ClientGone || gone ? 'stream_cut' : 'llm_error');
        if (!gone) emit('error', { error: 'assistant_unavailable', message: 'La réponse a été interrompue. Réessaie dans un instant.' });
      }
      try { controller.close(); } catch { /* déjà fermé */ }
    },
    cancel() {
      gone = true;
    },
  });
}
