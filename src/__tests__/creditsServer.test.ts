/**
 * @jest-environment node
 *
 * Crédits IA côté serveur (sans réseau, doubles en mémoire ; aucune clé Gemini ni RevenueCat) :
 *  - produits : formule lue sur l'identifiant (Famille ≠ Premium mensuel), packs consommables ;
 *  - webhook RevenueCat : NON_RENEWING_PURCHASE crédité une fois (idempotence sur la transaction), remboursement d'un
 *    pack, octroi mensuel sur INITIAL_PURCHASE / RENEWAL / PRODUCT_CHANGE vers Famille (jamais par l'application),
 *    réessai après un octroi échoué ;
 *  - assistant : réserve → débit seulement si livré ; restitution si l'IA échoue, si la réponse est bloquée ou si la
 *    diffusion est coupée ; réponses de refus (insufficient_credits, premium_required, ai_disabled) ;
 *  - ordre « sécurité avant tout » dans la fonction assistant (lecture du code : la détresse passe avant les crédits).
 */
jest.mock('../../supabase/functions/_shared/http.ts', () => ({
  json: (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  safeEqual: (a: string, b: string) => a === b,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as { join(...p: string[]): string };
declare const __dirname: string;
import {
  billedSseStream, ClientGone, grantFor, isCreditPack, packActionFor, requestKey, reserveRefusal, settle, tierOfProduct, transactionIdOf,
  type CreditsGate, type GrantAction,
} from '../../supabase/functions/_shared/credits';
// Module Deno (types npm:/Deno hors du périmètre de tsc) : chargé par require, contrat typé ici
type StoredRow = { user_id: string; status?: string | null; product_id?: string | null; expires_at?: string | null; [k: string]: unknown };
interface SubscriptionDb { read(id: string): Promise<StoredRow | null>; write(row: StoredRow): Promise<boolean>; notify(u: string, n: unknown): Promise<void>; locale(u: string): Promise<string | null>; premium(u: string): Promise<boolean> }
interface CreditsLedger { grantMonthly(u: string, g: GrantAction): Promise<boolean>; purchase(u: string, product: string, tx: string): Promise<boolean>; refund(tx: string): Promise<'ok' | 'not_found' | 'error'> }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handleWebhook } = require('../../supabase/functions/_shared/subscription-run') as {
  handleWebhook(r: Request, d: { secret: string; entitlement: string; api: null; db: SubscriptionDb; credits: CreditsLedger | null; now: () => number }): Promise<Response>;
};
import { buildPlans } from '@/lib/premium/plans';
import type { PurchasesPackage } from 'react-native-purchases';

const SECRET = 's3cret';
const ENT = 'HOMI_PREMIUM';
const U1 = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-11-26T10:00:00Z');
const DAY = 86_400_000;

function memoryDb() {
  const rows = new Map<string, StoredRow>();
  const db: SubscriptionDb = {
    read: (id) => Promise.resolve(rows.has(id) ? { ...rows.get(id)! } : null),
    write: (row) => { rows.set(row.user_id, { ...(rows.get(row.user_id) ?? {}), ...row }); return Promise.resolve(true); },
    notify: () => Promise.resolve(),
    locale: () => Promise.resolve(null),
    premium: () => Promise.resolve(true),
  };
  return { db, rows };
}

/** Grand livre en mémoire, mêmes clés d'idempotence que les RPC SQL. */
function memoryLedger(opts: { failGrant?: number } = {}) {
  const keys = new Set<string>();
  const purchases = new Map<string, number>();
  const log: string[] = [];
  let purchased = 0;
  let failGrant = opts.failGrant ?? 0;
  const ledger: CreditsLedger = {
    grantMonthly: async (_u, g: GrantAction) => {
      if (failGrant > 0) { failGrant--; return false; }
      if (!keys.has(g.key)) { keys.add(g.key); log.push(`grant:${g.tier}:${g.trial ? 'trial' : 'full'}`); }
      return true;
    },
    purchase: async (_u, product, tx) => {
      if (!purchases.has(tx)) { const n = Number(product.split('_').pop()); purchases.set(tx, n); purchased += n; log.push(`purchase:${n}`); }
      return true;
    },
    refund: async (tx) => {
      if (!purchases.has(tx)) return 'not_found';
      if (keys.has(`refund:${tx}`)) return 'ok';
      keys.add(`refund:${tx}`);
      const removed = Math.min(purchases.get(tx)!, purchased);
      purchased -= removed;
      log.push(`refund:${removed}`);
      return 'ok';
    },
  };
  return { ledger, log, balance: () => purchased };
}

const req = (event: Record<string, unknown>) => new Request('http://local/revenuecat-webhook', {
  method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ event }),
});
const ev = (type: string, extra: Record<string, unknown> = {}) => ({
  type, id: `ev-${type}-${Math.random()}`, app_user_id: U1, original_app_user_id: U1, product_id: 'homi_premium_monthly', entitlement_ids: [ENT],
  store: 'APP_STORE', environment: 'SANDBOX', period_type: 'NORMAL', event_timestamp_ms: NOW, expiration_at_ms: NOW + 30 * DAY, ...extra,
});
const hook = (db: SubscriptionDb, credits: CreditsLedger | null) => (r: Request) => handleWebhook(r, { secret: SECRET, entitlement: ENT, api: null, db, credits, now: () => NOW });

describe('produits', () => {
  it('formule lue sur l’identifiant de produit ; packs reconnus (Google Play : abonnement:offre)', () => {
    expect(tierOfProduct('homi_family_monthly_v2')).toBe('family');
    expect(tierOfProduct('homi_family_monthly_v2:base')).toBe('family');
    expect(tierOfProduct('homi_premium_monthly')).toBe('premium');
    expect(tierOfProduct(null)).toBe('premium');
    expect(isCreditPack('homi_credits_800')).toBe(true);
    expect(isCreditPack('homi_premium_monthly')).toBe(false);
  });
  it('plans.ts : un Famille mensuel n’est plus confondu avec le Premium mensuel (même type de package)', () => {
    const p = (id: string, price: number) => ({ identifier: id, packageType: 'MONTHLY', product: { identifier: id, price, priceString: `${price} €`, currencyCode: 'EUR', subscriptionPeriod: 'P1M', introPrice: null } }) as unknown as PurchasesPackage;
    const pkgs = [p('homi_family_monthly_v2', 19.99), p('homi_premium_monthly', 14.99), p('homi_credits_300', 2.99)];
    const premium = buildPlans(pkgs, 'ios', 'fr-FR');
    const family = buildPlans(pkgs, 'ios', 'fr-FR', 'family');
    expect(premium.map((x) => [x.id, x.tier])).toEqual([['homi_premium_monthly', 'premium']]);
    expect(family.map((x) => [x.id, x.tier, x.amount])).toEqual([['homi_family_monthly_v2', 'family', 19.99]]);
  });
});

describe('webhook RevenueCat → grand livre', () => {
  it('NON_RENEWING_PURCHASE d’un pack : crédité une seule fois (même transaction reçue deux fois), sans toucher à l’abonnement', async () => {
    const { db, rows } = memoryDb();
    const { ledger, log, balance } = memoryLedger();
    const e = ev('NON_RENEWING_PURCHASE', { product_id: 'homi_credits_800', entitlement_ids: null, transaction_id: '2000000123', expiration_at_ms: null });
    const r1 = await (await hook(db, ledger)(req(e))).json();
    const r2 = await (await hook(db, ledger)(req({ ...e, id: 'autre-id' }))).json();
    expect(r1).toEqual({ ok: true, credits: 'purchase' });
    expect(r2.credits).toBe('purchase');
    expect(log).toEqual(['purchase:800']);
    expect(balance()).toBe(800);
    expect(rows.size).toBe(0);
  });
  it('remboursement d’un pack (CANCELLATION) : retrait idempotent ; achat inconnu ignoré sans boucle de réessais', async () => {
    const { db } = memoryDb();
    const { ledger, log } = memoryLedger();
    await hook(db, ledger)(req(ev('NON_RENEWING_PURCHASE', { product_id: 'homi_credits_300', entitlement_ids: null, transaction_id: 'tx-1' })));
    const refund = ev('CANCELLATION', { product_id: 'homi_credits_300', entitlement_ids: null, transaction_id: 'tx-1', cancel_reason: 'CUSTOMER_SUPPORT' });
    expect((await hook(db, ledger)(req(refund))).status).toBe(200);
    await hook(db, ledger)(req(refund));
    expect(log).toEqual(['purchase:300', 'refund:300']);
    const unknown = await (await hook(db, ledger)(req({ ...refund, transaction_id: 'tx-inconnue' }))).json();
    expect(unknown.ignored).toBe('unknown_purchase');
  });
  it('pack sans compte (identifiant anonyme) : ignoré ; grand livre absent : 500 pour que RevenueCat réessaie', async () => {
    const { db } = memoryDb();
    const e = ev('NON_RENEWING_PURCHASE', { product_id: 'homi_credits_300', entitlement_ids: null, transaction_id: 'tx-2', app_user_id: '$RCAnonymousID:x', original_app_user_id: '$RCAnonymousID:x' });
    expect((await (await hook(db, memoryLedger().ledger)(req(e))).json()).ignored).toBe('anonymous_user');
    expect((await hook(db, null)(req({ ...e, app_user_id: U1 }))).status).toBe(500);
  });
  it('octroi mensuel : essai (50) puis conversion (total) ; doublon d’événement → un seul octroi', async () => {
    const { db } = memoryDb();
    const { ledger, log } = memoryLedger();
    await hook(db, ledger)(req(ev('INITIAL_PURCHASE', { period_type: 'TRIAL', expiration_at_ms: NOW + 3 * DAY })));
    const renewal = ev('RENEWAL', { event_timestamp_ms: NOW + 3 * DAY, expiration_at_ms: NOW + 33 * DAY });
    await hook(db, ledger)(req(renewal));
    await hook(db, ledger)(req(renewal));
    expect(log).toEqual(['grant:premium:trial', 'grant:premium:full']);
  });
  it('PRODUCT_CHANGE vers Famille : octroi Famille ; vers Premium (descente) : rien avant le renouvellement', async () => {
    const { db } = memoryDb();
    const { ledger, log } = memoryLedger();
    await hook(db, ledger)(req(ev('INITIAL_PURCHASE')));
    await hook(db, ledger)(req(ev('PRODUCT_CHANGE', { event_timestamp_ms: NOW + 1000, new_product_id: 'homi_family_monthly_v2' })));
    await hook(db, ledger)(req(ev('PRODUCT_CHANGE', { event_timestamp_ms: NOW + 2000, product_id: 'homi_family_monthly_v2', new_product_id: 'homi_premium_monthly' })));
    expect(log).toEqual(['grant:premium:full', 'grant:family:full']);
  });
  it('octroi échoué : 500, puis le réessai (même événement) octroie sans réécrire l’abonnement en double', async () => {
    const { db, rows } = memoryDb();
    const { ledger, log } = memoryLedger({ failGrant: 1 });
    const e = ev('INITIAL_PURCHASE');
    expect((await hook(db, ledger)(req(e))).status).toBe(500);
    expect(rows.get(U1)?.status).toBe('active');
    const again = await (await hook(db, ledger)(req(e))).json();
    expect(again.ignored).toBe('duplicate_event');
    expect(log).toEqual(['grant:premium:full']);
  });
  it('grantFor : clé stable par période (produit + échéance), jamais pour un abonnement inactif ni un pack', () => {
    const row = { status: 'active', product_id: 'homi_premium_annual', expires_at: new Date(NOW + 365 * DAY).toISOString() };
    const g = grantFor({ type: 'RENEWAL' }, row, U1)!;
    expect(g).toEqual({ tier: 'premium', trial: false, periodEnd: row.expires_at, key: `grant:${U1}:homi_premium_annual:${NOW + 365 * DAY}` });
    expect(grantFor({ type: 'RENEWAL' }, { ...row, status: 'expired' }, U1)).toBeNull();
    expect(grantFor({ type: 'CANCELLATION' }, row, U1)).toBeNull();
    expect(grantFor({ type: 'INITIAL_PURCHASE' }, { ...row, product_id: 'homi_credits_300' }, U1)).toBeNull();
  });
  it('packActionFor / transactionIdOf : transaction requise, autres événements ignorés', () => {
    expect(packActionFor({ type: 'NON_RENEWING_PURCHASE', product_id: 'homi_credits_2000', transaction_id: 'T1' })).toEqual({ kind: 'purchase', productId: 'homi_credits_2000', transactionId: 'T1' });
    expect(packActionFor({ type: 'NON_RENEWING_PURCHASE', product_id: 'homi_premium_monthly', transaction_id: 'T1' })).toBeNull();
    expect(packActionFor({ type: 'EXPIRATION', product_id: 'homi_credits_300', transaction_id: 'T1' })).toBeNull();
    expect(transactionIdOf({ type: 'X', original_transaction_id: 'O1' })).toBe('O1');
    expect(transactionIdOf({ type: 'X', transaction_id: 'mauvais id avec espaces' })).toBeNull();
  });
});

describe('assistant : réserve, débit, restitution', () => {
  function gate() {
    const calls: string[] = [];
    const g: CreditsGate = {
      reserve: async () => ({ ok: true, reservation_id: 'r1', cost: 1 }),
      commit: async (id) => { calls.push(`commit:${id}`); return true; },
      release: async (id, reason) => { calls.push(`release:${id}:${reason}`); return true; },
    };
    return { g, calls };
  }
  const encode = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  async function drain(s: ReadableStream<Uint8Array>, cancelAfter?: number) {
    const reader = s.getReader();
    const dec = new TextDecoder();
    let out = '';
    let n = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      out += dec.decode(value);
      if (cancelAfter != null && ++n >= cancelAfter) { await reader.cancel(); break; }
    }
    return out;
  }
  const tick = () => new Promise((r) => setTimeout(r, 5));

  it('diffusion réussie : débit après « done »', async () => {
    const { g, calls } = gate();
    const s = billedSseStream({ encode, meta: {}, settle: (d, r) => settle(g, 'r1', d, r), produce: async (emit) => { emit('delta', { text: 'a' }); return { done: { answer: 'a' } }; } });
    const out = await drain(s);
    await tick();
    expect(out).toContain('event: done');
    expect(calls).toEqual(['commit:r1']);
  });
  it('diffusion coupée par l’application : restitution (défaut corrigé : plus de question décomptée malgré une coupure)', async () => {
    const { g, calls } = gate();
    let resume!: () => void;
    const wait = new Promise<void>((r) => { resume = r; });
    const s = billedSseStream({
      encode, meta: {}, settle: (d, r) => settle(g, 'r1', d, r),
      produce: async (emit) => {
        emit('delta', { text: 'début' });
        await wait;
        if (!emit('delta', { text: 'suite' })) throw new ClientGone();
        return { done: {} };
      },
    });
    const p = drain(s, 2); // meta + premier fragment, puis l'application ferme
    await p;
    resume();
    await tick();
    expect(calls).toEqual(['release:r1:stream_cut']);
  });
  it('erreur de l’IA en cours de diffusion, ou réponse bloquée remplacée : restitution, jamais de débit', async () => {
    const a = gate();
    await drain(billedSseStream({ encode, meta: {}, settle: (d, r) => settle(a.g, 'r1', d, r), produce: async () => { throw new Error('gemini 500'); } }));
    const b = gate();
    await drain(billedSseStream({ encode, meta: {}, settle: (d, r) => settle(b.g, 'r1', d, r), produce: async () => ({ done: { cautious: true }, charge: false }) }));
    const c = gate();
    await drain(billedSseStream({ encode, meta: {}, settle: (d, r) => settle(c.g, 'r1', d, r), produce: async () => ({ error: { error: 'assistant_unavailable' } }) }));
    await tick();
    expect(a.calls).toEqual(['release:r1:llm_error']);
    expect(b.calls).toEqual(['release:r1:not_charged']);
    expect(c.calls).toEqual(['release:r1:assistant_unavailable']);
  });
  it('refus de réserve → réponses claires pour l’application', () => {
    const r = reserveRefusal({ ok: false, error: 'insufficient_credits', cost: 1, monthly_remaining: 0, purchased_remaining: 0, next_renewal: '2026-12-26T10:00:00Z' })!;
    expect(r.status).toBe(402);
    expect(r.body).toMatchObject({ error: 'insufficient_credits', cost: 1, credits: { monthly_remaining: 0, purchased_remaining: 0, next_renewal: '2026-12-26T10:00:00Z' } });
    expect(reserveRefusal({ ok: false, error: 'premium_required' })!.body.error).toBe('premium_required');
    expect(reserveRefusal({ ok: false, error: 'ai_disabled' })!.status).toBe(503);
    expect(reserveRefusal({ ok: true, reservation_id: 'r', cost: 1, replay: true, status: 'committed' })!.status).toBe(409);
    expect(reserveRefusal({ ok: true, reservation_id: 'r', cost: 1, replay: true, status: 'held' })).toBeNull();
    expect(reserveRefusal({ ok: true, reservation_id: 'r', cost: 1 })).toBeNull();
  });
  it('clé d’idempotence : identifiant de l’application repris tel quel ; invalide → identifiant unique', () => {
    expect(requestKey('assistant', U1, 'abcdef12-3456')).toBe('assistant:11111111:abcdef12-3456');
    expect(requestKey('assistant', U1, '../../x')).not.toBe(requestKey('assistant', U1, '../../x'));
  });
  it('settle ne lève jamais (une restitution manquée est rattrapée par l’expiration des réserves)', async () => {
    const broken: CreditsGate = { reserve: async () => ({ ok: false, error: 'x' }), commit: async () => { throw new Error('réseau'); }, release: async () => false };
    expect(await settle(broken, 'r', true, 'delivered')).toBe('failed');
    expect(await settle(broken, 'r', false, 'llm_error')).toBe('failed');
  });
});

describe('fonction assistant : sécurité avant tout, crédits ensuite', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../supabase/functions/assistant/index.ts'), 'utf8');
  it('la détresse est traitée (et renvoyée) AVANT toute réserve de crédit ; l’ancien compteur n’est plus utilisé', () => {
    const safety = src.indexOf('assessSafety(message)');
    const crisisReturn = src.indexOf('show_emergency_resources: true');
    const reserve = src.indexOf("gate.reserve('assistant_question'");
    expect(safety).toBeGreaterThan(0);
    expect(crisisReturn).toBeGreaterThan(safety);
    expect(reserve).toBeGreaterThan(crisisReturn);
    expect(src).not.toMatch(/consume_assistant_quota|refund_assistant_quota/);
  });
  it('débit seulement à la livraison ; restitution sur échec ; aucun texte dans les journaux', () => {
    expect(src).toContain('billedSseStream');
    expect(src).toMatch(/charge\(false, blocked \? 'blocked' : 'llm_error'\)/);
    for (const line of src.split('\n').filter((l: string) => l.includes('console.'))) expect(line).not.toMatch(/message\)|answer|raw\b(?!\.)|e\.message/);
  });
  it('toutes les fonctions qui appellent Gemini respectent l’interrupteur serveur', () => {
    for (const f of ['assistant', 'assistant-demo', 'scan-explain', 'document-read', 'document-extract', 'community-ai', 'cycle-photo']) {
      const code = fs.readFileSync(path.join(__dirname, `../../supabase/functions/${f}/index.ts`), 'utf8');
      expect([f, /enabledGeminiConfig|aiSwitchOpen/.test(code)]).toEqual([f, true]);
    }
  });
});
