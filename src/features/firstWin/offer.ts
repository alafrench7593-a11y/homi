/**
 * Paywall de la « première réussite » — logique PURE (testée : src/__tests__/firstWinOffer.test.ts).
 *
 * Tout montant vient du Plan (boutique StoreKit / Play via RevenueCat ; démonstration : grille signalée) ; toute date
 * est CALCULÉE (démarrage aujourd'hui) ou CONFIRMÉE (ligne d'abonnement écrite par le serveur après l'achat).
 *  - cartes : nom, accès inclus (Premium : toi + ton ou ta co-parent ; Famille : tous les adultes du foyer + crédits
 *    Aura partagés), période, MONTANT TOTAL facturé ; équivalent mensuel en complément ; économie avec sa base
 *    explicite (« par rapport à 12 × 14,99 € ») ;
 *  - au plus 3 bénéfices réellement disponibles dans la formule sélectionnée ;
 *  - frise : accès immédiat → date, montant exact et périodicité du premier paiement ;
 *  - bouton : « Démarrer mes 3 jours gratuits » SEULEMENT si la boutique confirme l'essai pour cette formule et ce
 *    compte (trialDays > 0 après applyTrialEligibility), sinon « S'abonner à 14,99 €/mois » ;
 *  - conditions sous le bouton : « Gratuit jusqu'au …, puis 14,99 €/mois. Renouvellement automatique. »
 */
import { formatDate, t as tr, type TKey } from '@/i18n';
import { billingDates, formatMoney, PLAN_MONTHS, type Plan, type PlanPeriod, type PlanTier } from '@/lib/premium/plans';
import { DEFAULT_GRANTS } from '@/lib/credits/model';
import type { NeedId } from './model';

export type OfferPlan = Pick<Plan, 'id' | 'period' | 'price' | 'amount' | 'currency' | 'trialDays' | 'demo'> & { tier?: PlanTier; perMonth?: string | null; savingsPct?: number | null };

/** « mois », « 6 mois », « an » (bouton : « 14,99 €/mois »). */
export const perShort = (p: PlanPeriod) => tr(`fw.per.${p}` as TKey);
/** « par mois », « tous les 6 mois », « par an » (périodicité dans la frise). */
export const perEvery = (p: PlanPeriod) => tr(`fw.every.${p}` as TKey);

export const tierOf = (p: Pick<OfferPlan, 'tier'>): PlanTier => p.tier ?? 'premium';
export const offerKey = (p: Pick<OfferPlan, 'tier' | 'period'>) => `${tierOf(p)}:${p.period}`;

export interface OfferCard {
  key: string;
  tier: PlanTier;
  period: PlanPeriod;
  name: string;
  /** Qui y a accès (texte de la carte) */
  access: string;
  /** Montant total facturé et sa période : « 119,99 € par an » */
  billed: string;
  /** Équivalent mensuel (6 mois, annuel) : « soit 10,00 € par mois » */
  monthly: string | null;
  /** Économie avec sa base explicite, ou null (jamais d'économie sans base) */
  saving: string | null;
  trialDays: number;
  demo: boolean;
  /** Lu par VoiceOver : tout ce qui est écrit sur la carte, dans l'ordre */
  a11y: string;
  plan: OfferPlan;
}

/** Économie d'une formule longue par rapport à N mensualités au prix RÉEL du mensuel (même devise), arrondie à l'inférieur. */
export function savingVsMonthly(plan: Pick<OfferPlan, 'amount' | 'currency' | 'period'>, monthly: Pick<OfferPlan, 'amount' | 'currency'> | null | undefined): number | null {
  const months = PLAN_MONTHS[plan.period];
  if (!monthly || months <= 1 || monthly.currency !== plan.currency || !(monthly.amount > 0) || !(plan.amount > 0)) return null;
  const pct = Math.floor((1 - plan.amount / (monthly.amount * months)) * 100 + 1e-9);
  return pct >= 1 ? pct : null;
}

export function offerCard(plan: OfferPlan, monthly: OfferPlan | null, locale: string): OfferCard {
  const tier = tierOf(plan);
  const months = PLAN_MONTHS[plan.period];
  const name = tier === 'family' ? tr('fw.plan.family') : tr(`fw.plan.${plan.period}` as TKey);
  const access = tier === 'family' ? tr('fw.access.family', { credits: DEFAULT_GRANTS.family }) : tr('fw.access.premium');
  const billed = tr('fw.billed', { price: plan.price, per: perEvery(plan.period) });
  const monthlyEq = months > 1 && plan.amount > 0 ? tr('fw.monthlyEq', { price: formatMoney(Math.round((plan.amount / months) * 100 + 1e-6) / 100, plan.currency, locale) }) : null;
  const pct = tier === 'premium' ? savingVsMonthly(plan, monthly) : null;
  const saving = pct && monthly ? tr('fw.saving', { pct, count: months, price: monthly.price }) : null;
  const a11y = [name, access, billed, monthlyEq, saving, plan.trialDays > 0 ? tr('fw.trialBadge', { count: plan.trialDays }) : null].filter(Boolean).join('. ');
  return { key: offerKey(plan), tier, period: plan.period, name, access, billed, monthly: monthlyEq, saving, trialDays: plan.trialDays, demo: plan.demo, a11y, plan };
}

/** Ordre d'affichage : du plus court au plus long engagement (le mensuel, présélectionné, arrive en premier). */
const PERIOD_RANK: Record<PlanPeriod, number> = { monthly: 0, six_months: 1, annual: 2 };

/** Cartes : Premium (mensuel, 6 mois, annuel) puis Famille. */
export function offerCards(premium: OfferPlan[], family: OfferPlan[], locale: string): OfferCard[] {
  const monthly = premium.find((p) => p.period === 'monthly') ?? null;
  return [...[...premium].sort((a, b) => PERIOD_RANK[a.period] - PERIOD_RANK[b.period]).map((p) => offerCard({ ...p, tier: 'premium' }, monthly, locale)), ...family.map((p) => offerCard({ ...p, tier: 'family' }, null, locale))];
}

/** Formule présélectionnée : celle choisie avant l'inscription si elle existe encore, sinon le mensuel Premium (prix d'appel lisible), sinon la première. */
export function defaultOfferKey(cards: Pick<OfferCard, 'key'>[], wanted?: string | null): string | null {
  if (wanted && cards.some((c) => c.key === wanted)) return wanted;
  return (cards.find((c) => c.key === 'premium:monthly') ?? cards[0])?.key ?? null;
}

// ------------------------------------------------------------------ bénéfices (au plus 3, réellement disponibles)
const NEED_BENEFIT: Record<NeedId, TKey> = {
  prepare_birth: 'fw.ben.prepare_birth',
  feed_sleep: 'fw.ben.feed_sleep',
  mornings: 'fw.ben.mornings',
  relay: 'fw.ben.relay',
};

/**
 * Bénéfices de la formule sélectionnée. Crédits Aura : annoncés seulement à la conversion (0 pendant l'essai) et, tant
 * qu'Aura en ligne est fermée (aiAssistantOnline = false), avec la mention « dès l'ouverture d'Aura ».
 */
export function benefitsFor(tier: PlanTier, need: NeedId | null, o: { aiOnline: boolean; trial: boolean }): string[] {
  const first = tr(need ? NEED_BENEFIT[need] : 'fw.ben.all');
  const credits = tier === 'family' ? DEFAULT_GRANTS.family : DEFAULT_GRANTS.premium;
  const creditLine = tr(tier === 'family' ? 'fw.ben.creditsFamily' : 'fw.ben.creditsPremium', { count: credits })
    + (o.trial ? tr('fw.ben.creditsAfterTrial') : '') + (o.aiOnline ? '' : tr('fw.ben.creditsSoon'));
  const share = tier === 'family' ? tr('fw.ben.allAdults') : tr('fw.ben.coparent');
  return [first, share, creditLine].slice(0, 3);
}

// ------------------------------------------------------------------ frise, bouton, conditions
const dayMonth = (d: Date, from: Date) => formatDate(d, d.getFullYear() === from.getFullYear() ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' });

export interface TimelineStep { key: 'today' | 'charge' | 'renew'; title: string; body: string }
export interface Timeline { steps: TimelineStep[]; caption: string; confirmed: boolean; firstCharge: Date }

/**
 * Frise : accès immédiat → premier paiement (date, montant exact, périodicité).
 *  - avant l'achat : dates CALCULÉES pour un démarrage aujourd'hui (le dire) ;
 *  - après l'achat : date CONFIRMÉE (fin d'essai ou échéance écrite par le serveur) quand elle est connue.
 */
export function timelineFor(plan: OfferPlan, o: { now: Date; confirmedFirstCharge?: Date | null }): Timeline {
  const calc = billingDates(plan, o.now);
  const confirmed = !!o.confirmedFirstCharge;
  const first = o.confirmedFirstCharge ?? calc.firstCharge;
  const amount = { price: plan.price, every: perEvery(plan.period) };
  const steps: TimelineStep[] = plan.trialDays > 0
    ? [
      { key: 'today', title: tr('fw.tl.today'), body: tr('fw.tl.todayTrial', { count: plan.trialDays }) },
      { key: 'charge', title: dayMonth(first, o.now), body: tr('fw.tl.firstCharge', amount) },
    ]
    : [
      { key: 'today', title: tr('fw.tl.today'), body: tr('fw.tl.todayPaid', amount) },
      { key: 'renew', title: dayMonth(confirmed ? first : calc.renewal, o.now), body: tr('fw.tl.renew', amount) },
    ];
  return { steps, caption: tr(confirmed ? 'fw.tl.confirmed' : 'fw.tl.estimated'), confirmed, firstCharge: first };
}

/** Libellé du bouton : l'essai n'est promis que s'il est confirmé pour cette formule ET ce compte. */
export function ctaFor(plan: Pick<OfferPlan, 'trialDays' | 'price' | 'period'>): string {
  return plan.trialDays > 0 ? tr('fw.cta.trial', { count: plan.trialDays }) : tr('fw.cta.subscribe', { price: plan.price, per: perShort(plan.period) });
}

/** Conditions lisibles sous le bouton. */
export function termsFor(plan: Pick<OfferPlan, 'trialDays' | 'price' | 'period'>, now: Date): string {
  if (plan.trialDays > 0) return tr('fw.terms.trial', { date: dayMonth(billingDates(plan, now).firstCharge, now), price: plan.price, per: perShort(plan.period) });
  return tr('fw.terms.paid', { price: plan.price, per: perShort(plan.period) });
}

// ------------------------------------------------------------------ états du catalogue et de l'achat
export type CatalogState = 'loading' | 'offline' | 'unavailable' | 'error' | 'empty' | 'ready';

/** État du catalogue → affichage. L'achat n'est possible qu'à l'état « ready ». */
export function catalogState(o: { mode: string; online: boolean; isLoading: boolean; isError: boolean; count: number; web?: boolean; networkError?: boolean }): CatalogState {
  if (o.mode === 'unavailable' || (o.web && o.mode !== 'test')) return 'unavailable';
  if (!o.online && !o.count) return 'offline';
  if (o.isLoading) return 'loading';
  if (o.isError) return o.online && !o.networkError ? 'error' : 'offline';
  if (!o.count) return 'empty';
  return 'ready';
}

export type PurchasePhase =
  | 'idle' | 'buying' | 'cancelled' | 'deferred' | 'pending' | 'failed' | 'confirmed'
  | 'restoring' | 'restored' | 'restore_none' | 'restore_failed';

export interface PhaseView { tone: 'info' | 'success' | 'warning' | 'danger'; text: TKey; busy: boolean }

export function phaseView(p: PurchasePhase): PhaseView | null {
  switch (p) {
    case 'idle': return null;
    case 'buying': return { tone: 'info', text: 'fw.state.buying', busy: true };
    case 'restoring': return { tone: 'info', text: 'fw.state.restoring', busy: true };
    case 'cancelled': return { tone: 'info', text: 'fw.state.cancelled', busy: false };
    case 'deferred': return { tone: 'info', text: 'fw.state.deferred', busy: false };
    case 'pending': return { tone: 'info', text: 'fw.state.pending', busy: false };
    case 'failed': return { tone: 'danger', text: 'fw.state.failed', busy: false };
    case 'confirmed': return { tone: 'success', text: 'fw.state.confirmed', busy: false };
    case 'restored': return { tone: 'success', text: 'fw.state.restored', busy: false };
    case 'restore_none': return { tone: 'info', text: 'fw.state.restoreNone', busy: false };
    case 'restore_failed': return { tone: 'warning', text: 'fw.state.restoreFailed', busy: false };
  }
}

/** Le bouton d'achat est actif seulement avec un catalogue chargé, une formule choisie et rien en cours. */
export function canBuy(catalog: CatalogState, phase: PurchasePhase, hasPlan: boolean): boolean {
  return catalog === 'ready' && hasPlan && phase !== 'buying' && phase !== 'restoring' && phase !== 'confirmed';
}

/** Confirmation après l'achat : date de fin d'essai ou de première facturation CONFIRMÉE par le serveur, si connue. */
export function confirmedChargeDate(sub: { status?: string | null; trial_ends_at?: string | null; expires_at?: string | null } | null | undefined): Date | null {
  if (!sub) return null;
  const iso = sub.status === 'trial' ? (sub.trial_ends_at ?? sub.expires_at) : sub.expires_at;
  const d = iso ? new Date(iso) : null;
  return d && Number.isFinite(d.getTime()) ? d : null;
}
