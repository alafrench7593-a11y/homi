/**
 * État de l'abonnement Premium — MÊME règle que la fonction serveur public.has_premium (la seule qui fait foi) :
 * statut essai, actif, période de grâce ou annulé (sans renouvellement) ET date d'expiration non dépassée.
 * Ce module sert à expliquer l'état à l'utilisatrice (date de renouvellement, fin d'essai, expiration) ; il n'accorde
 * jamais de droit : l'application lit toujours has_premium.
 */
export type SubStatus = 'none' | 'trial' | 'active' | 'grace' | 'cancelled' | 'expired' | 'billing_issue';
export interface SubRow {
  status: SubStatus;
  product_id?: string | null;
  store?: string | null;
  period_type?: 'monthly' | 'annual' | 'trial' | 'lifetime' | null;
  expires_at?: string | null;
  will_renew?: boolean | null;
}
export type EntitlementState = 'free' | 'trial' | 'active' | 'ending' | 'grace' | 'expired' | 'billing_issue';
export interface Entitlement { premium: boolean; state: EntitlementState; until: string | null; renews: boolean; message: string }

const PREMIUM_STATUSES: SubStatus[] = ['trial', 'active', 'grace', 'cancelled'];

const fmt = (iso: string, tz?: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz });

export function entitlement(sub: SubRow | null | undefined, now: Date = new Date(), tz?: string): Entitlement {
  if (!sub || sub.status === 'none') return { premium: false, state: 'free', until: null, renews: false, message: 'Version gratuite.' };
  const notExpired = !sub.expires_at || Date.parse(sub.expires_at) > now.getTime();
  const premium = PREMIUM_STATUSES.includes(sub.status) && notExpired;
  const until = sub.expires_at ?? null;
  const d = until ? fmt(until, tz) : '';
  if (premium) {
    if (sub.status === 'grace') return { premium, state: 'grace', until, renews: true, message: `Problème de paiement : Premium est maintenu jusqu’au ${d} le temps de mettre à jour votre moyen de paiement.` };
    if (sub.status === 'cancelled' || sub.will_renew === false) return { premium, state: 'ending', until, renews: false, message: `Premium jusqu’au ${d}, sans renouvellement. Ensuite, retour à la version gratuite : toutes vos données restent consultables.` };
    if (sub.status === 'trial') return { premium, state: 'trial', until, renews: true, message: `Essai gratuit jusqu’au ${d}. Sans annulation avant cette date, l’abonnement choisi démarre et est facturé automatiquement.` };
    return { premium, state: 'active', until, renews: true, message: until ? `Renouvellement automatique le ${d}.` : 'Premium actif.' };
  }
  if (sub.status === 'billing_issue') return { premium: false, state: 'billing_issue', until, renews: false, message: 'Le paiement n’a pas abouti : les fonctions Premium sont en pause. Vos données restent consultables.' };
  return { premium: false, state: 'expired', until, renews: false, message: `${until ? `Abonnement terminé le ${d}. ` : 'Abonnement terminé. '}Vos données restent consultables ; les fonctions Premium sont en pause.` };
}
