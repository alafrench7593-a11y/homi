/**
 * État de l'abonnement Premium — MÊME règle que la fonction serveur public._subscription_grants (la seule qui fait
 * foi, via has_premium) : statut essai, actif, période de grâce, annulé (renouvellement coupé) ou pause programmée
 * ET échéance future. Une échéance inconnue ne donne jamais un Premium sans fin, sauf octroi promotionnel ou à vie
 * explicite. Remboursé : plus aucun droit, immédiatement.
 * Ce module EXPLIQUE l'état (formule, dates, statut) ; il n'accorde jamais de droit : l'application lit has_premium.
 */
import { t as tr, formatDate } from '@/i18n';

export type SubStatus = 'none' | 'trial' | 'active' | 'grace' | 'cancelled' | 'expired' | 'billing_issue' | 'refunded' | 'paused';
export interface SubRow {
  status: SubStatus;
  product_id?: string | null;
  store?: string | null;
  period_type?: 'monthly' | 'six_months' | 'annual' | 'trial' | 'lifetime' | null;
  expires_at?: string | null;
  will_renew?: boolean | null;
  started_at?: string | null;
  trial_ends_at?: string | null;
  price?: number | string | null;
  currency?: string | null;
  cancel_reason?: string | null;
  refunded_at?: string | null;
  billing_issue_at?: string | null;
  resumes_at?: string | null;
  environment?: 'production' | 'sandbox' | null;
}
/** Statuts affichés : Gratuit, Essai, Actif, Annulé, Problème de paiement, Période de grâce, Expiré, Remboursé, En pause. */
export type EntitlementState = 'free' | 'trial' | 'active' | 'cancelled' | 'grace' | 'expired' | 'billing_issue' | 'refunded' | 'paused';
export interface Entitlement {
  premium: boolean;
  state: EntitlementState;
  /** Échéance des droits (renouvellement, fin d'essai, fin de période) */
  until: string | null;
  renews: boolean;
  message: string;
}

const GRANTING: SubStatus[] = ['trial', 'active', 'grace', 'cancelled', 'paused'];

/** Même règle que public._subscription_grants (migration 20261105000100_subscription_v2.sql). */
export function grants(sub: Pick<SubRow, 'status' | 'expires_at' | 'store' | 'period_type'> | null | undefined, now: Date = new Date()): boolean {
  if (!sub || !GRANTING.includes(sub.status)) return false;
  if (sub.expires_at) return Date.parse(sub.expires_at) > now.getTime();
  return sub.status === 'active' && (sub.store === 'promotional' || sub.period_type === 'lifetime');
}

const fmt = (iso: string, tz?: string) => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz });

export function entitlement(sub: SubRow | null | undefined, now: Date = new Date(), tz?: string): Entitlement {
  if (!sub || sub.status === 'none') return { premium: false, state: 'free', until: null, renews: false, message: tr('l6.ent.free') };
  const premium = grants(sub, now);
  const until = sub.expires_at ?? null;
  const d = until ? fmt(until, tz) : '';
  if (sub.status === 'refunded') return { premium: false, state: 'refunded', until, renews: false, message: tr('sub2.ent.refunded') };
  if (premium) {
    if (sub.status === 'grace') return { premium, state: 'grace', until, renews: true, message: tr('l6.ent.grace', { date: d }) };
    if (sub.status === 'paused') return { premium, state: 'paused', until, renews: false, message: tr('sub2.ent.pauseScheduled', { date: d }) };
    if (sub.status === 'cancelled' || sub.will_renew === false) return { premium, state: 'cancelled', until, renews: false, message: tr('l6.ent.ending', { date: d }) };
    if (sub.status === 'trial') return { premium, state: 'trial', until, renews: true, message: tr('l6.ent.trial', { date: d }) };
    return { premium, state: 'active', until, renews: !!until, message: until ? tr('l6.ent.renews', { date: d }) : tr('l6.ent.active') };
  }
  if (sub.status === 'billing_issue') return { premium: false, state: 'billing_issue', until, renews: false, message: tr('l6.ent.billing') };
  if (sub.status === 'paused') {
    return { premium: false, state: 'paused', until, renews: false, message: sub.resumes_at ? tr('sub2.ent.pausedUntil', { date: fmt(sub.resumes_at, tz) }) : tr('sub2.ent.paused') };
  }
  return { premium: false, state: 'expired', until, renews: false, message: (until ? tr('l6.ent.endedOn', { date: d }) : tr('l6.ent.ended')) + tr('l6.ent.endedTail') };
}
