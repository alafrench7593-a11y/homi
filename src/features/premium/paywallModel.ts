/**
 * Écran Premium v2 — logique d'affichage pure (testée par Jest) : formule sélectionnée par défaut, libellé exact du
 * bouton, chronologie de l'essai, libellés lus par VoiceOver / TalkBack, message de chaque issue d'achat.
 * Tout montant vient du Plan (boutique ou grille de démonstration) ; toute date de billingDates ; rien n'est écrit en dur.
 */
import { billingDates, type Plan, type PlanPeriod } from '@/lib/premium/plans';
import type { PurchaseErrorKind } from '@/lib/premium/purchaseErrors';
import { formatDate, t as tr, type TKey } from '@/i18n';

/** Formule proposée d'abord : l'annuelle (mise en avant), sinon la première disponible. */
export function defaultPeriod(plans: Pick<Plan, 'period'>[]): PlanPeriod | null {
  return (plans.find((p) => p.period === 'annual') ?? plans[0])?.period ?? null;
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
    { key: 'during', title: tr('pay2.tl.during', { count: plan.trialDays }), body: tr('pay2.tl.duringBody') },
    { key: 'charge', title: tr('pay2.tl.charge', { date: chargeDate(plan, from) }), body: tr('pay2.tl.chargeBody', { plan: planName(plan.period), price: plan.price }) },
  ];
}

/** Ce que lit le lecteur d'écran pour une formule : nom, prix et période en toutes lettres, économie, essai. */
export function planA11yLabel(plan: Pick<Plan, 'period' | 'price' | 'perMonth' | 'savingsPct' | 'trialDays'>, featured = false): string {
  const parts = [planName(plan.period), `${plan.price} ${perLong(plan.period)}`];
  if (plan.perMonth) parts.push(tr('pay2.plan.a11y.perMonth', { price: plan.perMonth }));
  if (plan.savingsPct) parts.push(tr('pay2.plan.a11y.save', { pct: plan.savingsPct }));
  if (plan.trialDays > 0) parts.push(tr('pay2.plan.a11y.trial', { count: plan.trialDays }));
  if (featured) parts.push(tr('pay2.plan.a11y.badge'));
  return parts.join(', ');
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
