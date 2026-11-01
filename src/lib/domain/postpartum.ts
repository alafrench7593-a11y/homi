/**
 * Suivi post-partum : logique pure (sans réseau), testée.
 *
 * Ce module ne produit JAMAIS de diagnostic ni de score. Il traduit des besoins que la mère
 * a elle-même déclarés en propositions de soutien concrètes, et oriente vers une aide humaine
 * urgente quand elle signale un danger. Une seule réponse ne suffit jamais à conclure quoi que ce soit.
 */

import { t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

export type Need = 'rest' | 'relay' | 'talk' | 'practical' | 'professional' | 'other' | 'no_answer';

const NEEDS_FR: { value: Need; label: string }[] = [
  { value: 'rest', label: 'Dormir ou me reposer' },
  { value: 'relay', label: 'Être relayée avec le bébé' },
  { value: 'talk', label: 'Parler à quelqu’un' },
  { value: 'practical', label: 'Recevoir une aide pratique' },
  { value: 'professional', label: 'Prendre rendez-vous avec un professionnel' },
  { value: 'other', label: 'J’ai besoin d’autre chose' },
  { value: 'no_answer', label: 'Je préfère ne pas répondre' },
];
const NEEDS_EN: { value: Need; label: string }[] = [
  { value: 'rest', label: 'Sleep or rest' },
  { value: 'relay', label: 'Have someone take over with the baby' },
  { value: 'talk', label: 'Talk to someone' },
  { value: 'practical', label: 'Get some practical help' },
  { value: 'professional', label: 'Book an appointment with a professional' },
  { value: 'other', label: 'I need something else' },
  { value: 'no_answer', label: 'I would rather not answer' },
];
export const NEEDS: { value: Need; label: string }[] = localized(NEEDS_FR, NEEDS_EN);

export interface PostpartumCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  feeling: number | null;
  mood: number | null;
  fatigue: number | null;
  stress: number | null;
  sleep_quality: number | null;
  supported: number | null;
  coping: number | null;
  rest_need: number | null;
  help_need: number | null;
  needs: Need[];
  need_other: string | null;
  comment: string | null;
  physical_fatigue: number | null;
  pain: number | null;
  pain_note: string | null;
  recovery: number | null;
  feeding_note: string | null;
  difficulties: string | null;
  urgent_orientation_shown: boolean;
  created_at: string;
  updated_at?: string;
}

export type CheckinInput = Omit<PostpartumCheckin, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/**
 * Échelles du check-in. `positive` : 5 = mieux (humeur), sinon 5 = plus intense (fatigue).
 * Les libellés décrivent un ressenti, jamais une performance.
 */
type ScaleDef = { key: keyof CheckinInput; label: string; positive: boolean; low: string; high: string };
const SCALES_FR: ScaleDef[] = [
  { key: 'feeling', label: 'Comment je me sens aujourd’hui', positive: true, low: 'Très mal', high: 'Bien' },
  { key: 'mood', label: 'Mon humeur générale', positive: true, low: 'Très basse', high: 'Bonne' },
  { key: 'fatigue', label: 'Ma fatigue', positive: false, low: 'Peu fatiguée', high: 'Épuisée' },
  { key: 'stress', label: 'Mon stress ou mon anxiété', positive: false, low: 'Calme', high: 'Très forte' },
  { key: 'sleep_quality', label: 'La qualité de mon sommeil', positive: true, low: 'Très mauvaise', high: 'Bonne' },
  { key: 'supported', label: 'Je me sens soutenue', positive: true, low: 'Pas du tout', high: 'Tout à fait' },
  { key: 'coping', label: 'J’arrive à gérer le quotidien', positive: true, low: 'Pas du tout', high: 'Tout à fait' },
  { key: 'rest_need', label: 'Mon besoin de repos', positive: false, low: 'Faible', high: 'Très fort' },
  { key: 'help_need', label: 'Mon besoin d’aide', positive: false, low: 'Faible', high: 'Très fort' },
];
const SCALES_EN: ScaleDef[] = [
  { key: 'feeling', label: 'How I feel today', positive: true, low: 'Very bad', high: 'Good' },
  { key: 'mood', label: 'My general mood', positive: true, low: 'Very low', high: 'Good' },
  { key: 'fatigue', label: 'My tiredness', positive: false, low: 'Hardly tired', high: 'Exhausted' },
  { key: 'stress', label: 'My stress or anxiety', positive: false, low: 'Calm', high: 'Very strong' },
  { key: 'sleep_quality', label: 'The quality of my sleep', positive: true, low: 'Very poor', high: 'Good' },
  { key: 'supported', label: 'I feel supported', positive: true, low: 'Not at all', high: 'Completely' },
  { key: 'coping', label: 'I am managing day to day', positive: true, low: 'Not at all', high: 'Completely' },
  { key: 'rest_need', label: 'My need for rest', positive: false, low: 'Low', high: 'Very high' },
  { key: 'help_need', label: 'My need for help', positive: false, low: 'Low', high: 'Very high' },
];
export const SCALES: ScaleDef[] = localized(SCALES_FR, SCALES_EN);

const PHYSICAL_SCALES_FR: ScaleDef[] = [
  { key: 'physical_fatigue', label: 'Fatigue physique', positive: false, low: 'Légère', high: 'Très forte' },
  { key: 'pain', label: 'Douleurs', positive: false, low: 'Aucune ou presque', high: 'Fortes' },
  { key: 'recovery', label: 'Récupération générale', positive: true, low: 'Difficile', high: 'Bonne' },
];
const PHYSICAL_SCALES_EN: ScaleDef[] = [
  { key: 'physical_fatigue', label: 'Physical tiredness', positive: false, low: 'Mild', high: 'Very strong' },
  { key: 'pain', label: 'Pain', positive: false, low: 'None or almost none', high: 'Strong' },
  { key: 'recovery', label: 'Overall recovery', positive: true, low: 'Hard', high: 'Good' },
];
export const PHYSICAL_SCALES: ScaleDef[] = localized(PHYSICAL_SCALES_FR, PHYSICAL_SCALES_EN);

// ------------------------------------------------------------------ danger immédiat
/** Questions de sécurité : facultatives, jamais enregistrées dans le détail. */
type DangerQ = { readonly key: 'self' | 'baby' | 'confusion'; readonly label: string };
const DANGER_QUESTIONS_FR: readonly DangerQ[] = [
  { key: 'self', label: 'J’ai des pensées de me faire du mal ou de ne plus être là.' },
  { key: 'baby', label: 'J’ai des pensées de faire du mal à mon bébé.' },
  { key: 'confusion', label: 'Je me sens très confuse, ou j’ai l’impression que la réalité m’échappe.' },
];
const DANGER_QUESTIONS_EN: readonly DangerQ[] = [
  { key: 'self', label: 'I have thoughts of harming myself or of no longer being here.' },
  { key: 'baby', label: 'I have thoughts of harming my baby.' },
  { key: 'confusion', label: 'I feel very confused, or I feel as if reality is slipping away from me.' },
];
export const DANGER_QUESTIONS: readonly DangerQ[] = localized(DANGER_QUESTIONS_FR, DANGER_QUESTIONS_EN);
export type DangerKey = DangerQ['key'];

export interface EmergencyContact { phone: string; label: string; when: string }

/**
 * Numéros vérifiés (sante.gouv.fr, « Que faire face à une crise suicidaire ? ») : 3114 gratuit 24 h/24 ;
 * 15 ou 112 en cas de risque imminent. Hors France : le 112 européen, et le numéro d'urgence local.
 */
export function emergencyContacts(country: string): EmergencyContact[] {
  if (country === 'FR') {
    return [
      { phone: '3114', label: tr('l5.pp.ec.3114.label'), when: tr('l5.pp.ec.3114.when') },
      { phone: '15', label: tr('l5.pp.ec.15.label'), when: tr('l5.pp.ec.15.when') },
      { phone: '112', label: tr('l5.pp.ec.112.label'), when: tr('l5.pp.ec.112.when') },
    ];
  }
  return [{ phone: '112', label: tr('l5.pp.ec.112.label'), when: tr('l5.pp.ec.112.whenOther') }];
}

// ------------------------------------------------------------------ propositions de soutien
export type SupportLevel = 'none' | 'rest' | 'strain' | 'distress' | 'danger';

export interface SupportAction {
  key: string;
  label: string;
  detail: string;
  /** Route interne, ou action locale (`call:<numéro>`). Jamais une action automatique. */
  to?: string;
}

export interface SupportPlan {
  level: SupportLevel;
  title: string;
  message: string;
  actions: SupportAction[];
}

const supportActions = () => ({
  relay: { key: 'relay', label: tr('l5.pp.a.relay.label'), detail: tr('l5.pp.a.relay.detail'), to: '/postpartum/sharing' },
  rest: { key: 'rest', label: tr('l5.pp.a.rest.label'), detail: tr('l5.pp.a.rest.detail'), to: '/postpartum/support' },
  postpone: { key: 'postpone', label: tr('l5.pp.a.postpone.label'), detail: tr('l5.pp.a.postpone.detail') },
  delegate: { key: 'delegate', label: tr('l5.pp.a.delegate.label'), detail: tr('l5.pp.a.delegate.detail'), to: '/postpartum/support' },
  talkPartner: { key: 'talk_partner', label: tr('l5.pp.a.talkPartner.label'), detail: tr('l5.pp.a.talkPartner.detail') },
  trusted: { key: 'trusted', label: tr('l5.pp.a.trusted.label'), detail: tr('l5.pp.a.trusted.detail'), to: '/postpartum/support' },
  pro: { key: 'pro', label: tr('l5.pp.a.pro.label'), detail: tr('l5.pp.a.pro.detail'), to: '/postpartum/support' },
  proSoon: { key: 'pro_soon', label: tr('l5.pp.a.proSoon.label'), detail: tr('l5.pp.a.proSoon.detail'), to: '/postpartum/support' },
  notes: { key: 'notes', label: tr('l5.pp.a.notes.label'), detail: tr('l5.pp.a.notes.detail'), to: '/postpartum/support' },
  understand: { key: 'understand', label: tr('l5.pp.a.understand.label'), detail: tr('l5.pp.a.understand.detail'), to: '/postpartum/understand' },
} satisfies Record<string, SupportAction>);

const low = (v: number | null | undefined) => v != null && v <= 2;
const high = (v: number | null | undefined) => v != null && v >= 4;

/**
 * Propositions graduées à partir de ce que la mère a déclaré AUJOURD'HUI (§ 22.5), plus
 * la persistance éventuelle sur plusieurs jours (jamais une seule réponse).
 * `danger` provient uniquement des questions de sécurité qu'elle a cochées elle-même.
 */
export function supportPlan(c: Partial<CheckinInput>, opts: { danger?: DangerKey[]; persistentLowDays?: number; country?: string } = {}): SupportPlan {
  const A = supportActions();
  if (opts.danger && opts.danger.length > 0) {
    return {
      level: 'danger',
      title: tr('l5.pp.danger.title'),
      message: tr('l5.pp.danger.message'),
      actions: emergencyContacts(opts.country ?? 'FR').map((e) => ({ key: `call_${e.phone}`, label: tr('l5.pp.danger.call', { phone: e.phone, label: e.label }), detail: e.when, to: `call:${e.phone}` })),
    };
  }
  const needs = new Set(c.needs ?? []);
  const sad = low(c.feeling) || low(c.mood);
  const persistent = (opts.persistentLowDays ?? 0) >= 5;
  const strained = high(c.fatigue) || high(c.stress) || low(c.coping) || high(c.help_need);

  if (persistent || (sad && (low(c.coping) || high(c.stress)))) {
    return {
      level: 'distress',
      title: persistent ? tr('l5.pp.distress.titlePersistent') : tr('l5.pp.distress.titleToday'),
      message: persistent ? tr('l5.pp.distress.msgPersistent') : tr('l5.pp.distress.msgToday'),
      actions: [A.proSoon, A.trusted, A.notes, A.relay, A.understand],
    };
  }
  if (strained || needs.has('professional') || needs.has('talk')) {
    const actions: SupportAction[] = [];
    if (needs.has('professional')) actions.push(A.pro);
    if (needs.has('talk')) actions.push(A.talkPartner, A.trusted);
    actions.push(A.postpone, A.relay);
    if (!needs.has('professional')) actions.push(A.pro);
    return {
      level: 'strain',
      title: tr('l5.pp.strain.title'),
      message: tr('l5.pp.strain.message'),
      actions: dedupe(actions),
    };
  }
  if (needs.has('rest') || needs.has('relay') || needs.has('practical') || high(c.rest_need)) {
    const actions: SupportAction[] = [];
    if (needs.has('relay')) actions.push(A.relay);
    if (needs.has('rest') || high(c.rest_need)) actions.push(A.rest, A.relay);
    if (needs.has('practical')) actions.push(A.delegate);
    actions.push(A.postpone);
    return { level: 'rest', title: tr('l5.pp.rest.title'), message: tr('l5.pp.rest.message'), actions: dedupe(actions) };
  }
  return { level: 'none', title: tr('l5.pp.none.title'), message: tr('l5.pp.none.message'), actions: [] };
}

function dedupe(a: SupportAction[]) {
  const seen = new Set<string>();
  return a.filter((x) => (seen.has(x.key) ? false : (seen.add(x.key), true)));
}

/** Nombre de jours (sur les `window` derniers) où l'humeur ou le ressenti déclarés étaient bas. */
export function persistentLowDays(checkins: Pick<PostpartumCheckin, 'checkin_date' | 'feeling' | 'mood'>[], today: string, window = 14): number {
  const from = addDays(today, -(window - 1));
  return checkins.filter((c) => c.checkin_date >= from && c.checkin_date <= today && (low(c.feeling) || low(c.mood))).length;
}

// ------------------------------------------------------------------ tendances (descriptives)
export interface TrendPoint { date: string; value: number | null }

/** Série jour par jour (valeur déclarée ou trou), pour un graphique simple. Aucune moyenne « notée ». */
export function trendSeries(checkins: PostpartumCheckin[], key: keyof CheckinInput, today: string, days = 14): TrendPoint[] {
  const byDate = new Map(checkins.map((c) => [c.checkin_date, c]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i));
    const v = byDate.get(date)?.[key];
    return { date, value: typeof v === 'number' ? v : null };
  });
}

/** Description neutre d'une évolution, jamais une conclusion médicale. */
export function describeTrend(points: TrendPoint[], positive: boolean): string {
  const vals = points.map((p) => p.value).filter((v): v is number => v != null);
  if (vals.length < 3) return tr('l5.pp.trend.notEnough');
  const half = Math.floor(vals.length / 2);
  const first = avg(vals.slice(0, half));
  const last = avg(vals.slice(half));
  const delta = last - first;
  if (Math.abs(delta) < 0.5) return tr('l5.pp.trend.stable');
  const better = positive ? delta > 0 : delta < 0;
  return better ? tr('l5.pp.trend.lighter') : tr('l5.pp.trend.heavier');
}

const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------ partage avec le foyer
export interface PostpartumSettings {
  user_id: string;
  delivery_date: string | null;
  active: boolean;
  reminders_enabled: boolean;
  reminder_time: string;
  country: string;
  share_household_id: string | null;
  share_rest_need: boolean;
  share_availability: boolean;
  share_relay_requests: boolean;
  share_summary: boolean;
  plan_rest_needs: string[];
  plan_tasks_to_delegate: string[];
  plan_notes: string | null;
}

export const DEFAULT_SETTINGS: Omit<PostpartumSettings, 'user_id'> = {
  delivery_date: null, active: true, reminders_enabled: false, reminder_time: '20:00', country: 'FR',
  share_household_id: null, share_rest_need: false, share_availability: false, share_relay_requests: false, share_summary: false,
  plan_rest_needs: [], plan_tasks_to_delegate: [], plan_notes: null,
};

export interface SharedStatus {
  user_id: string;
  household_id: string;
  rest_need: 'none' | 'some' | 'high' | null;
  availability: 'available' | 'resting' | 'unavailable' | null;
  relay_requested: boolean;
  relay_note: string | null;
  summary: string | null;
  updated_at: string;
}

/** Même filtre que le serveur : n'envoie que ce que la mère a autorisé (le serveur refiltre de toute façon). */
export function filterShared(s: Pick<PostpartumSettings, 'share_rest_need' | 'share_availability' | 'share_relay_requests' | 'share_summary'>, v: Partial<SharedStatus>): Partial<SharedStatus> {
  return {
    rest_need: s.share_rest_need ? v.rest_need ?? null : null,
    availability: s.share_availability ? v.availability ?? null : null,
    relay_requested: s.share_relay_requests ? !!v.relay_requested : false,
    relay_note: s.share_relay_requests ? v.relay_note ?? null : null,
    summary: s.share_summary ? v.summary ?? null : null,
  };
}

export const anySharing = (s: Pick<PostpartumSettings, 'share_rest_need' | 'share_availability' | 'share_relay_requests' | 'share_summary'>) =>
  s.share_rest_need || s.share_availability || s.share_relay_requests || s.share_summary;

const REST_LABEL_FR: Record<NonNullable<SharedStatus['rest_need']>, string> = {
  none: 'Pas de besoin particulier', some: 'A besoin de souffler', high: 'A vraiment besoin de repos',
};
const REST_LABEL_EN: Record<NonNullable<SharedStatus['rest_need']>, string> = {
  none: 'No particular need', some: 'Needs a breather', high: 'Really needs rest',
};
export const REST_LABEL: Record<NonNullable<SharedStatus['rest_need']>, string> = localized(REST_LABEL_FR, REST_LABEL_EN);
const AVAILABILITY_LABEL_FR: Record<NonNullable<SharedStatus['availability']>, string> = {
  available: 'Disponible', resting: 'Se repose', unavailable: 'Pas disponible pour le moment',
};
const AVAILABILITY_LABEL_EN: Record<NonNullable<SharedStatus['availability']>, string> = {
  available: 'Available', resting: 'Resting', unavailable: 'Not available at the moment',
};
export const AVAILABILITY_LABEL: Record<NonNullable<SharedStatus['availability']>, string> = localized(AVAILABILITY_LABEL_FR, AVAILABILITY_LABEL_EN);

/**
 * « Comment m'aider ? » : gestes concrets proposés au conjoint, à partir de ce que la mère a CHOISI
 * de partager. Aucune interprétation de ses réponses privées (il n'y a pas accès).
 */
export function helpIdeas(s: Pick<SharedStatus, 'rest_need' | 'availability' | 'relay_requested'>): string[] {
  const ideas: string[] = [];
  if (s.relay_requested) ideas.push(tr('l5.pp.idea.relay'));
  if (s.rest_need === 'high' || s.rest_need === 'some') {
    ideas.push(tr('l5.pp.idea.sleep'));
    ideas.push(tr('l5.pp.idea.night'));
  }
  if (s.availability === 'resting' || s.availability === 'unavailable') ideas.push(tr('l5.pp.idea.avoid'));
  ideas.push(tr('l5.pp.idea.chores'));
  ideas.push(tr('l5.pp.idea.ask'));
  return [...new Set(ideas)];
}

// ------------------------------------------------------------------ démarches
type ActionKindDef = { value: 'appointment_booked' | 'professional_contacted' | 'talked' | 'rest_taken' | 'relay_received' | 'other'; label: string };
const ACTION_KINDS_FR: ActionKindDef[] = [
  { value: 'appointment_booked', label: 'J’ai pris un rendez-vous' },
  { value: 'professional_contacted', label: 'J’ai contacté un professionnel' },
  { value: 'talked', label: 'J’en ai parlé à quelqu’un' },
  { value: 'rest_taken', label: 'J’ai pris du repos' },
  { value: 'relay_received', label: 'J’ai été relayée' },
  { value: 'other', label: 'Autre démarche' },
];
const ACTION_KINDS_EN: ActionKindDef[] = [
  { value: 'appointment_booked', label: 'I booked an appointment' },
  { value: 'professional_contacted', label: 'I contacted a professional' },
  { value: 'talked', label: 'I talked to someone' },
  { value: 'rest_taken', label: 'I took some rest' },
  { value: 'relay_received', label: 'Someone took over for me' },
  { value: 'other', label: 'Other step' },
];
export const ACTION_KINDS: ActionKindDef[] = localized(ACTION_KINDS_FR, ACTION_KINDS_EN);

/** Idées de besoins de repos et de tâches à déléguer pour préparer le plan de soutien (avant ou après la naissance). */
export const PLAN_REST_IDEAS = ['Une sieste protégée chaque jour', 'Une nuit complète par semaine', 'Une douche tranquille', 'Sortir marcher seule', 'Limiter les visites'];
export const PLAN_TASK_IDEAS = ['Courses', 'Repas', 'Linge', 'Ménage', 'Rendez-vous administratifs', 'Aînés : école et activités', 'Accueillir les visites', 'Biberons de nuit'];
