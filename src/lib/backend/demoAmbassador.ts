/**
 * Démonstration (sans serveur) : programme Ambassadeurs, mêmes règles que 20261210000100_ambassadeurs.sql —
 * conditions actives publiques, candidature (compte requis, code unique normalisé, conditions acceptées), code saisi
 * par un nouveau parent (validé seulement, jamais soi-même, une seule fois, pas après un premier paiement), tableau de
 * bord (montants issus des commissions, jamais estimés). Les commissions ne s'écrivent jamais depuis l'appareil.
 * En démonstration, la candidature est validée tout de suite (aucune équipe pour la relire) et le dit.
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import { normalizeCode, rateFor, type AmbassadorTerms } from '@/lib/ambassador/commission';
import { AMBASSADOR_TERMS_V1 } from '@/lib/ambassador/termsV1';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export interface AmbassadorCtx { T: (name: string) => Row[]; me: () => string | undefined; nowIso: () => string; uuid: () => string }

export function createAmbassador(c: AmbassadorCtx) {
  const { T } = c;
  const terms = (): AmbassadorTerms => (T('ambassador_terms_public')[0] as AmbassadorTerms | undefined) ?? (T('ambassador_terms_public').push({ ...AMBASSADOR_TERMS_V1 }), AMBASSADOR_TERMS_V1);
  const mine = () => T('ambassadors').find((a) => a.user_id === c.me());
  const need = () => { if (!c.me()) throw new BackendError(tr('l2.dm.forbidden'), '42501'); };

  function filter(table: string, rows: Row[]): Row[] | null {
    if (table === 'ambassador_terms_public') { terms(); return T('ambassador_terms_public'); }
    if (table === 'ambassadors') return rows.filter((r) => r.user_id === c.me());
    if (table === 'ambassador_commissions' || table === 'ambassador_payouts') { const a = mine(); return a ? rows.filter((r) => r.ambassador_id === a.id) : []; }
    if (table === 'referral_attributions') return rows.filter((r) => r.user_id === c.me());
    return null;
  }

  const rpcs: Record<string, (a: Row) => unknown> = {
    ambassador_apply: (a) => {
      need();
      const t = terms();
      if (!a.p_accept) return { ok: false, reason: 'terms' };
      const code = normalizeCode(String(a.p_code ?? ''));
      if (!code) return { ok: false, reason: 'code_format' };
      if (T('ambassadors').some((x) => x.code === code)) return { ok: false, reason: 'code_taken' };
      const email = String(a.p_email ?? '').trim().toLowerCase();
      if (mine() || T('ambassadors').some((x) => String(x.email).toLowerCase() === email)) return { ok: false, reason: 'already' };
      if (String(a.p_name ?? '').trim().length < 2 || !email.includes('@')) return { ok: false, reason: 'invalid' };
      T('ambassadors').push({ id: c.uuid(), user_id: c.me(), code, display_name: String(a.p_name).trim(), email, status: 'approved', tier: 'starter',
        rate_override: null, terms_version: t.version, legal_status: a.p_legal_status, siret: a.p_siret || null, social_links: a.p_social ?? [],
        audience: a.p_audience || null, accepted_terms_at: c.nowIso(), created_at: c.nowIso(), approved_at: c.nowIso(), demo_auto_approved: true });
      return { ok: true, status: 'approved', code, demo: true };
    },
    ambassador_claim: (a) => {
      need();
      const code = normalizeCode(String(a.p_code ?? ''));
      const amb = T('ambassadors').find((x) => x.code === code && x.status === 'approved');
      if (!amb) return { ok: false, reason: 'unknown' };
      if (amb.user_id === c.me()) return { ok: false, reason: 'self' };
      if (T('referral_attributions').some((r) => r.user_id === c.me())) return { ok: false, reason: 'already' };
      if (T('conversion_events').some((r) => r.user_id === c.me())) return { ok: false, reason: 'already_paying' };
      T('referral_attributions').push({ user_id: c.me(), ambassador_id: amb.id, code, source: a.p_source === 'link' ? 'link' : 'code', attributed_at: c.nowIso(), locked_at: null });
      return { ok: true, name: amb.display_name };
    },
    my_ambassador: () => {
      const a = mine();
      if (!a) return null;
      const t = terms();
      const com = T('ambassador_commissions').filter((x) => x.ambassador_id === a.id);
      const sum = (st: string) => com.filter((x) => x.status === st).reduce((s, x) => s + Number(x.amount_cents), 0);
      const month = new Date(c.nowIso()).toISOString().slice(0, 7);
      return {
        status: a.status, code: a.code, tier: a.tier, rate: rateFor(t, a.tier, a.rate_override), commission_months: t.commission_months,
        payout_threshold_cents: t.payout_threshold_cents, hold_days: t.hold_days,
        referred: T('referral_attributions').filter((r) => r.ambassador_id === a.id).length,
        converted: new Set(com.filter((x) => x.status !== 'reversed').map((x) => x.referred_user_id)).size,
        pending_cents: sum('pending'), payable_cents: sum('payable'), paid_cents: sum('paid'), reversed_cents: sum('reversed'),
        month_cents: com.filter((x) => x.status !== 'reversed' && String(x.occurred_at).slice(0, 7) === month).reduce((s, x) => s + Number(x.amount_cents), 0),
        next_available_at: com.filter((x) => x.status === 'pending').map((x) => x.available_at).sort()[0] ?? null,
        currency: t.reference.currency, demo_auto_approved: !!a.demo_auto_approved,
      };
    },
  };
  return { filter, rpcs };
}
