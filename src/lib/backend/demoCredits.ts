/**
 * Démonstration (sans serveur) : crédits HOMI IA, mêmes règles que 20261126000100_credits_ia.sql.
 *  - compte par payeur (Premium : partagé avec le second adulte ; Famille : solde commun du foyer) ;
 *  - octroi mensuel à l'achat simulé d'un abonnement (miroir du webhook) : 1 000 / 1 500 crédits, essai 50 ;
 *  - mensuels d'abord, puis achetés ; mensuels expirés au renouvellement ; achetés sans expiration ;
 *  - réserve → débit (résultat livré) ou restitution ; refus « insufficient_credits » ;
 *  - faux magasin : achat simulé d'un pack (aucun paiement), crédité une seule fois par transaction.
 * Grand livre append-only : chaque solde est la somme de ses mouvements (vérifié par Jest).
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import { tierOfProduct } from '../premium/plans';
import { DEFAULT_COSTS, DEFAULT_GRANTS, PACK_CREDITS, type CreditAction, type CreditPackId } from '../credits/model';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface CreditsCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  nowIso: () => string;
  uuid: () => string;
  /** Abonnement actif d'une personne (miroir de _subscription_grants), ou null. */
  activeSub: (user: string) => Row | null;
  /** Abonné·e qui ouvre Premium à la personne connectée (partage Premium ou Famille), ou null. */
  giver: () => string | null;
}

const MONTH = 30 * 86_400_000;

export function createCredits(c: CreditsCtx) {
  const { T } = c;
  /** Réglages du serveur simulés (l'interrupteur et les coûts peuvent être changés par les tests). */
  const settings = () => (T('_credit_settings')[0] ??= { ai_enabled: true, costs: { ...DEFAULT_COSTS }, grants: { ...DEFAULT_GRANTS, trial: 0 } }); // essai : aucun crédit d'IA (décision du 20/11/2026)

  function payerOf(me: string): { payer: string; tier: 'premium' | 'family' } | null {
    const own = c.activeSub(me);
    if (own) return { payer: me, tier: tierOfProduct(own.product_id) };
    const g = c.giver();
    const sub = g ? c.activeSub(g) : null;
    return g && sub ? { payer: g, tier: tierOfProduct(sub.product_id) } : null;
  }

  function ensure(payer: string, tier: 'premium' | 'family' | null): Row {
    const accs = T('credit_accounts');
    let a = accs.find((x) => x.payer_id === payer);
    const hh = tier === 'family'
      ? (T('household_members').filter((m) => m.user_id === payer && (m.role === 'owner' || m.role === 'coparent'))
        .sort((x, y) => Number(y.role === 'owner') - Number(x.role === 'owner'))[0]?.household_id ?? null)
      : null;
    if (!a) {
      a = { id: c.uuid(), payer_id: payer, household_id: hh, tier: tier ?? 'premium', monthly_allowance: 0, monthly_balance: 0, purchased_balance: 0,
        period_start: null, period_end: null, created_at: c.nowIso() };
      accs.push(a);
    } else if (tier) {
      a.tier = tier;
      a.household_id = hh;
    }
    a.holder_kind = a.household_id ? 'household' : 'user';
    return a;
  }

  function ledger(a: Row, kind: string, m: number, p: number, extra: Row = {}) {
    T('credit_ledger').push({ id: c.uuid(), account_id: a.id, actor_id: c.me() ?? null, kind, amount: m + p, monthly_delta: m, purchased_delta: p,
      action: null, product_id: null, created_at: c.nowIso(), ...extra });
    a.monthly_balance += m;
    a.purchased_balance += p;
  }

  /** Octroi mensuel (miroir de credits_grant_monthly) : le reste du mois expire, nouveau mensuel. */
  function grant(payer: string, tier: 'premium' | 'family', periodEnd: string | null, trial = false) {
    const a = ensure(payer, tier);
    const s = settings();
    const allowance = trial ? Number(s.grants.trial ?? 0) : Number(s.grants[tier] ?? DEFAULT_GRANTS[tier]);
    if (a.monthly_balance > 0) ledger(a, 'expire', -a.monthly_balance, 0); // sans report
    ledger(a, 'monthly_grant', allowance, 0);
    const end = Math.min(Date.now() + MONTH, periodEnd ? Date.parse(periodEnd) : Date.now() + MONTH);
    Object.assign(a, { monthly_allowance: allowance, period_start: c.nowIso(), period_end: new Date(end).toISOString() });
    return a;
  }

  /** Réserve (mensuels d'abord), comme credits_reserve : refus « insufficient_credits » si le solde ne couvre pas le coût. */
  function reserve(action: CreditAction): { reservation_id: string; cost: number; monthly_remaining: number; purchased_remaining: number } {
    const me = c.me();
    if (!me) throw new BackendError(tr('l2.dm.signinDot'), '42501');
    const s = settings();
    if (!s.ai_enabled) throw new BackendError(tr('cr.err.aiOff'), 'ai_disabled', undefined, 503);
    const payer = payerOf(me);
    if (!payer) throw new BackendError(tr('cr.err.premium'), 'premium_required', 'premium_required', 402);
    const a = ensure(payer.payer, payer.tier);
    const cost = Number(s.costs[action] ?? DEFAULT_COSTS[action] ?? 0);
    if (!(cost > 0)) throw new BackendError(tr('cr.err.unknown'), 'unknown_action', undefined, 400);
    const m = Math.min(cost, a.monthly_balance);
    const p = cost - m;
    if (p > a.purchased_balance) throw new BackendError(tr('cr.err.insufficient'), 'insufficient_credits', undefined, 402);
    const rid = c.uuid();
    T('credit_reservations').push({ id: rid, account_id: a.id, user_id: me, action, cost, from_monthly: m, from_purchased: p, status: 'held', created_at: c.nowIso() });
    ledger(a, 'reserve', -m, -p, { action, reservation_id: rid });
    return { reservation_id: rid, cost, monthly_remaining: a.monthly_balance, purchased_remaining: a.purchased_balance };
  }

  /** Débit définitif (résultat livré), comme credits_commit ; idempotent. */
  function commit(rid: string): boolean {
    const r = T('credit_reservations').find((x) => x.id === rid);
    if (!r) return false;
    if (r.status === 'committed') return true;
    if (r.status !== 'held') return false;
    r.status = 'committed';
    T('credit_ledger').push({ id: c.uuid(), account_id: r.account_id, actor_id: r.user_id, kind: 'debit', amount: -r.cost, monthly_delta: 0, purchased_delta: 0, action: r.action,
      product_id: null, reservation_id: rid, created_at: new Date(Date.now() + 1).toISOString() });
    return true;
  }

  /** Restitution (échec, réponse refusée), comme credits_release : le solde revient tel qu'avant la réserve. */
  function release(rid: string, reason: string): boolean {
    const r = T('credit_reservations').find((x) => x.id === rid);
    if (!r) return false;
    if (r.status === 'released') return true;
    if (r.status !== 'held') return false;
    const a = T('credit_accounts').find((x) => x.id === r.account_id);
    if (!a) return false;
    r.status = 'released';
    ledger(a, 'release', r.from_monthly, r.from_purchased, { action: r.action, reservation_id: rid, meta: { reason } });
    return true;
  }

  /** Réserve → débit immédiat : en démonstration le « résultat » est livré sur l'appareil. */
  function spend(action: CreditAction): Row {
    const r = reserve(action);
    commit(r.reservation_id);
    return { ok: true, cost: r.cost };
  }

  function status(): Row | null {
    const me = c.me();
    if (!me) return null;
    const payer = payerOf(me);
    const a = T('credit_accounts').find((x) => x.payer_id === (payer?.payer ?? me));
    const used = a ? T('credit_ledger').filter((l) => l.account_id === a.id && l.kind === 'debit' && a.period_start && l.created_at >= a.period_start)
      .reduce((n, l) => n - Number(l.amount), 0) : 0;
    return {
      subscribed: !!payer, tier: payer?.tier ?? a?.tier ?? null, holder_kind: a?.holder_kind ?? (payer?.tier === 'family' ? 'household' : 'user'),
      payer_is_me: payer ? payer.payer === me : null, monthly_allowance: a?.monthly_allowance ?? 0, monthly_remaining: a?.monthly_balance ?? 0,
      purchased_remaining: a?.purchased_balance ?? 0, reserved: 0, used_this_period: used, period_start: a?.period_start ?? null,
      next_renewal: a?.period_end ?? null, ai_enabled: !!settings().ai_enabled,
    };
  }

  const rpcs: Record<string, (a: Row) => unknown> = {
    credits_status: () => status(),
    credits_config: () => {
      const s = settings();
      return { ai_enabled: !!s.ai_enabled, costs: { ...s.costs }, packs: { ...PACK_CREDITS }, grants: { premium: s.grants.premium, family: s.grants.family }, purchase_requires_subscription: true };
    },
    credits_history: (a) => {
      const me = c.me();
      if (!me) return [];
      const payer = payerOf(me);
      const acc = T('credit_accounts').find((x) => x.payer_id === (payer?.payer ?? me));
      if (!acc) return [];
      const before = typeof a.p_before === 'string' ? a.p_before : null;
      const lim = Math.max(1, Math.min(Number(a.p_limit ?? 20), 100));
      return T('credit_ledger')
        .filter((l) => l.account_id === acc.id && ['monthly_grant', 'purchase', 'debit', 'expire', 'refund', 'adjust'].includes(l.kind) && (!before || l.created_at < before))
        .sort((x, y) => (x.created_at < y.created_at ? 1 : x.created_at > y.created_at ? -1 : 0))
        .slice(0, lim)
        .map((l) => ({ id: l.id, kind: l.kind, amount: l.amount, action: l.action ?? null, product_id: l.product_id ?? null, by_me: l.actor_id === me, created_at: l.created_at }));
    },
    // Faux magasin : achat simulé d'un pack (aucun paiement), seulement avec un abonnement actif (règle de l'application)
    demo_credit_purchase: (a) => {
      const me = c.me();
      if (!me) throw new BackendError(tr('l2.dm.signinDot'), '42501');
      const id = String(a.product_id ?? '') as CreditPackId;
      const n = PACK_CREDITS[id];
      if (!n) throw new BackendError(tr('cr.err.unknown'), 'unknown_product', undefined, 400);
      const payer = payerOf(me);
      if (!payer) throw new BackendError(tr('cr.err.premium'), 'premium_required', 'premium_required', 402);
      const acc = ensure(payer.payer, payer.tier);
      const tx = String(a.transaction_id ?? c.uuid());
      if (T('credit_ledger').some((l) => l.rc_transaction_id === tx && l.kind === 'purchase')) return { ok: true, replay: true };
      ledger(acc, 'purchase', 0, n, { product_id: id, rc_transaction_id: tx });
      return { ok: true, credited: n, purchased_remaining: acc.purchased_balance };
    },
    // Démonstration : action facturée sans IA (le bouton « Analyser avec HOMI IA » de l'écran Mes crédits)
    demo_credit_spend: (a) => spend((String(a.action ?? 'tool_analysis') as CreditAction)),
    // Démonstration et tests : fixer le solde (épuisement…) par des lignes « ajustement » du grand livre
    demo_credit_adjust: (a) => {
      const me = c.me();
      if (!me) throw new BackendError(tr('l2.dm.signinDot'), '42501');
      const payer = payerOf(me);
      const acc = ensure(payer?.payer ?? me, payer?.tier ?? null);
      const m = Math.max(0, Math.floor(Number(a.monthly ?? acc.monthly_balance))) - acc.monthly_balance;
      const p = Math.max(0, Math.floor(Number(a.purchased ?? acc.purchased_balance))) - acc.purchased_balance;
      if (m || p) ledger(acc, 'adjust', m, p);
      if (typeof a.ai_enabled === 'boolean') settings().ai_enabled = a.ai_enabled;
      return status();
    },
  };

  return { rpcs, grant, spend, reserve, commit, release, status, settings };
}
