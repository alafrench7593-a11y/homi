/**
 * Écran Premium v2 et page d'abonnement — logique d'affichage pure (testée par Jest), partagée par les deux écrans :
 * formule conseillée et sélectionnée par défaut, libellé exact du bouton, chronologie de l'essai, conditions
 * tarifaires, libellés lus par VoiceOver / TalkBack, message de chaque issue d'achat, résumé de l'abonnement en cours.
 * Tout montant vient du Plan (boutique ou grille de démonstration) ; toute date de billingDates ; rien n'est écrit en dur.
 */
import type { Entitlement, SubRow } from '@/lib/premium/entitlement';
import { billingDates, periodOfProduct, type Plan, type PlanPeriod } from '@/lib/premium/plans';
import type { PurchaseErrorKind } from '@/lib/premium/purchaseErrors';
import { formatDate, t as tr, type TKey } from '@/i18n';

/**
 * Formule conseillée : celle dont le prix ramené au mois est le plus bas, d'après l'économie CALCULÉE sur les prix
 * réels (savingsPct). Aucune économie calculable (devises différentes, mensuel absent, prix non avantageux) :
 * aucune formule n'est signalée.
 */
export function recommendedPeriod(plans: Pick<Plan, 'period' | 'savingsPct'>[]): PlanPeriod | null {
  let best: Pick<Plan, 'period' | 'savingsPct'> | null = null;
  for (const p of plans) if ((p.savingsPct ?? 0) > (best?.savingsPct ?? 0)) best = p;
  return best?.period ?? null;
}

/** Formule proposée d'abord : la formule conseillée, sinon l'annuelle, sinon la première disponible. */
export function defaultPeriod(plans: Pick<Plan, 'period' | 'savingsPct'>[] | Pick<Plan, 'period'>[]): PlanPeriod | null {
  const list = plans as Pick<Plan, 'period' | 'savingsPct'>[];
  return recommendedPeriod(list) ?? (list.find((p) => p.period === 'annual') ?? list[0])?.period ?? null;
}

export const planName = (p: PlanPeriod) => tr(`sub2.plan.${p}.title` as TKey);
/** « par mois », « pour 6 mois », « par an » */
export const perLong = (p: PlanPeriod) => tr(`sub2.plan.${p}.per` as TKey);
/** « mois », « 6 mois », « an » (bouton : « 119,99 € / an ») */
export const perShort = (p: PlanPeriod) => tr(`pay2.per.${p}` as TKey);

/** Date du premier prélèvement formatée selon la langue (année ajoutée seulement si elle change). */
export function chargeDate(plan: Pick<Plan, 'period' | 'trialDays'>, from: Date = new Date()): string {
  const d = billingDates(plan, from).firstCharge;
  const opts: Intl.DateTimeFormatOptions = d.getFullYear() === from.getFullYear() ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' };
  return formatDate(d, opts);
}

/** Libellé du bouton : dit exactement ce qui se passe à l'appui. */
export function ctaLabel(plan: Pick<Plan, 'trialDays' | 'price' | 'period'>): string {
  if (plan.trialDays > 0) return tr('pay2.cta.trial', { count: plan.trialDays });
  return tr('pay2.cta.subscribe', { price: plan.price, per: perShort(plan.period) });
}

/** Précision lue après le libellé du bouton (montant, période, date réelle du premier prélèvement). */
export function ctaHint(plan: Pick<Plan, 'trialDays' | 'price' | 'period'>, from: Date = new Date()): string {
  if (plan.trialDays > 0) return tr('pay2.cta.hint.trial', { count: plan.trialDays, price: plan.price, per: perLong(plan.period), date: chargeDate(plan, from) });
  return tr('pay2.cta.hint.subscribe', { price: plan.price, per: perLong(plan.period) });
}

export interface TimelineStep { key: 'today' | 'during' | 'charge'; title: string; body: string }

/** Chronologie de l'essai (seulement si la boutique confirme un essai pour cette formule). */
export function trialTimeline(plan: Pick<Plan, 'trialDays' | 'price' | 'period'>, from: Date = new Date()): TimelineStep[] {
  if (!(plan.trialDays > 0)) return [];
  return [
    { key: 'today', title: tr('pay2.tl.today'), body: tr('pay2.tl.todayBody') },
    { key: 'during', title: tr('pay2.tl.during', { count: plan.trialDays }), body: tr('pay2.tl.duringBody', { date: chargeDate(plan, from) }) },
    { key: 'charge', title: tr('pay2.tl.charge', { date: chargeDate(plan, from) }), body: tr('pay2.tl.chargeBody', { plan: planName(plan.period), price: plan.price }) },
  ];
}

/** Ce que lit le lecteur d'écran pour une formule : nom, prix et période en toutes lettres, économie, essai. */
export function planA11yLabel(plan: Pick<Plan, 'period' | 'price' | 'perMonth' | 'savingsPct' | 'trialDays'>, featured = false, current = false): string {
  const parts = [planName(plan.period), `${plan.price} ${perLong(plan.period)}`];
  if (plan.perMonth) parts.push(tr('pay2.plan.a11y.perMonth', { price: plan.perMonth }));
  if (plan.savingsPct) parts.push(tr('pay2.plan.a11y.save', { pct: plan.savingsPct }));
  if (plan.trialDays > 0) parts.push(tr('pay2.plan.a11y.trial', { count: plan.trialDays }));
  if (featured) parts.push(tr('pay2.plan.a11y.badge'));
  if (current) parts.push(tr('sub3.plan.current'));
  return parts.join(', ');
}

/** Renouvellement automatique, en clair : montant et période de la formule choisie (affiché avec le bouton d'achat). */
export const renewLine = (plan: Pick<Plan, 'price' | 'period'>): string => tr('pay2.fine.renew', { price: plan.price, per: perLong(plan.period) });

export interface TermLine { key: 'charge' | 'renew' | 'cancel' | 'source'; text: string }

/**
 * Conditions tarifaires de la formule choisie, identiques sur l'écran Premium et sur la page d'abonnement :
 * ce qui est prélevé et quand, renouvellement automatique, comment annuler, origine du prix.
 * Sans essai confirmé par la boutique (trialDays = 0), aucune ligne ne parle d'essai.
 */
export function purchaseTerms(plan: Pick<Plan, 'trialDays' | 'price' | 'period' | 'demo'>, os: string, from: Date = new Date()): TermLine[] {
  return [
    { key: 'charge', text: ctaHint(plan, from) },
    { key: 'renew', text: renewLine(plan) },
    { key: 'cancel', text: tr(cancelHintKey(os)) },
    { key: 'source', text: plan.demo ? tr('pay2.fine.demo') : tr('pay2.fine.store') },
  ];
}

/** Abonnement PERSONNEL en cours (essai, actif, grâce, résilié mais encore ouvert, pause programmée). */
export function ownActive(sub: Pick<SubRow, 'status'> | null | undefined, premium: boolean): boolean {
  return !!sub && premium && ['trial', 'active', 'grace', 'cancelled', 'paused'].includes(sub.status);
}

/** Formule d'un abonnement (colonne period_type, sinon identifiant du produit). */
export function periodOfSub(sub: Pick<SubRow, 'period_type' | 'product_id'> | null | undefined): PlanPeriod | null {
  const p = sub?.period_type;
  return p === 'monthly' || p === 'six_months' || p === 'annual' ? p : periodOfProduct(sub?.product_id);
}

export interface SubscriberSummary {
  /** Achat personnel, ou Premium partagé par l'autre adulte du foyer (aucun abonnement personnel en cours). */
  origin: 'own' | 'shared';
  originText: string;
  /** Formule en cours (inconnue pour un Premium partagé : la facturation appartient à la personne abonnée). */
  period: PlanPeriod | null;
  /** Prochaine échéance, fin d'essai ou fin d'accès si résilié (phrase datée) ; partage : qui partage. */
  message: string;
  /** Vrai si la personne peut gérer cet abonnement (changer de formule, résilier) : jamais pour un Premium partagé. */
  manageable: boolean;
}

/** Vue abonné : origine, formule et échéance. Null si la personne n'a pas Premium. */
export function subscriberSummary(
  ent: Pick<Entitlement, 'message'> & { premium: boolean; sub?: Pick<SubRow, 'status' | 'period_type' | 'product_id'> | null },
  sharedBy?: { display_name: string | null } | null,
): SubscriberSummary | null {
  if (!ent.premium) return null;
  if (ownActive(ent.sub, true)) {
    return { origin: 'own', originText: tr('sub3.origin.own'), period: periodOfSub(ent.sub), message: ent.message, manageable: true };
  }
  const name = sharedBy?.display_name?.trim();
  return {
    origin: 'shared',
    originText: name ? tr('sub3.origin.shared', { name }) : tr('sub3.origin.sharedAnon'),
    period: null,
    message: name ? tr('sub2.page.sharedBy', { name }) : tr('sub2.page.sharedAnon'),
    manageable: false,
  };
}

/** Comment annuler, selon la plateforme (web de démonstration : la marche à suivre iPhone, l'application étant iOS). */
export const cancelHintKey = (os: string): TKey => (os === 'android' ? 'pay2.fine.cancel.android' : 'pay2.fine.cancel.ios');

export type Feedback = { tone: 'success' | 'info' | 'warning' | 'error'; text: string };

/** Message de chaque issue d'achat. Jamais de succès tant que le serveur ne confirme pas (« confirmed »). */
export function outcomeFeedback(outcome: 'confirmed' | 'pending' | 'deferred' | 'cancelled'): Feedback {
  switch (outcome) {
    case 'confirmed': return { tone: 'success', text: tr('pay2.welcome') };
    case 'pending': return { tone: 'info', text: tr('sub2.page.pending') };
    case 'deferred': return { tone: 'info', text: tr('pay2.err.deferred') };
    case 'cancelled': return { tone: 'info', text: tr('pay2.err.cancelled') };
  }
}

export function errorFeedback(kind: PurchaseErrorKind | 'unavailable'): Feedback {
  switch (kind) {
    case 'cancelled': return { tone: 'info', text: tr('pay2.err.cancelled') };
    case 'deferred': return { tone: 'info', text: tr('pay2.err.deferred') };
    case 'network': return { tone: 'warning', text: tr('pay2.err.network') };
    case 'not_allowed': return { tone: 'warning', text: tr('pay2.err.not_allowed') };
    case 'store': return { tone: 'warning', text: tr('pay2.err.store') };
    case 'unavailable': return { tone: 'info', text: tr('pay2.err.unavailable') };
    default: return { tone: 'error', text: tr('pay2.err.unknown') };
  }
}
