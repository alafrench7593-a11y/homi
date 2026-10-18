/**
 * Suivi post-partum : logique pure (sans réseau), testée.
 *
 * Ce module ne produit JAMAIS de diagnostic ni de score. Il traduit des besoins que la mère
 * a elle-même déclarés en propositions de soutien concrètes, et oriente vers une aide humaine
 * urgente quand elle signale un danger. Une seule réponse ne suffit jamais à conclure quoi que ce soit.
 */

export type Need = 'rest' | 'relay' | 'talk' | 'practical' | 'professional' | 'other' | 'no_answer';

export const NEEDS: { value: Need; label: string }[] = [
  { value: 'rest', label: 'Dormir ou me reposer' },
  { value: 'relay', label: 'Être relayée avec le bébé' },
  { value: 'talk', label: 'Parler à quelqu’un' },
  { value: 'practical', label: 'Recevoir une aide pratique' },
  { value: 'professional', label: 'Prendre rendez-vous avec un professionnel' },
  { value: 'other', label: 'J’ai besoin d’autre chose' },
  { value: 'no_answer', label: 'Je préfère ne pas répondre' },
];

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
export const SCALES: { key: keyof CheckinInput; label: string; positive: boolean; low: string; high: string }[] = [
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

export const PHYSICAL_SCALES: { key: keyof CheckinInput; label: string; positive: boolean; low: string; high: string }[] = [
  { key: 'physical_fatigue', label: 'Fatigue physique', positive: false, low: 'Légère', high: 'Très forte' },
  { key: 'pain', label: 'Douleurs', positive: false, low: 'Aucune ou presque', high: 'Fortes' },
  { key: 'recovery', label: 'Récupération générale', positive: true, low: 'Difficile', high: 'Bonne' },
];

// ------------------------------------------------------------------ danger immédiat
/** Questions de sécurité : facultatives, jamais enregistrées dans le détail. */
export const DANGER_QUESTIONS = [
  { key: 'self', label: 'J’ai des pensées de me faire du mal ou de ne plus être là.' },
  { key: 'baby', label: 'J’ai des pensées de faire du mal à mon bébé.' },
  { key: 'confusion', label: 'Je me sens très confuse, ou j’ai l’impression que la réalité m’échappe.' },
] as const;
export type DangerKey = (typeof DANGER_QUESTIONS)[number]['key'];

export interface EmergencyContact { phone: string; label: string; when: string }

/**
 * Numéros vérifiés (sante.gouv.fr, « Que faire face à une crise suicidaire ? ») : 3114 gratuit 24 h/24 ;
 * 15 ou 112 en cas de risque imminent. Hors France : le 112 européen, et le numéro d'urgence local.
 */
export function emergencyContacts(country: string): EmergencyContact[] {
  if (country === 'FR') {
    return [
      { phone: '3114', label: 'Prévention du suicide', when: 'Gratuit, confidentiel, 24 h/24. Des soignants formés vous répondent.' },
      { phone: '15', label: 'SAMU', when: 'Si le danger est immédiat, pour vous ou pour votre bébé.' },
      { phone: '112', label: 'Numéro d’urgence européen', when: 'Toute urgence, depuis n’importe quel téléphone.' },
    ];
  }
  return [{ phone: '112', label: 'Numéro d’urgence européen', when: 'Toute urgence. Hors d’Europe, composez le numéro d’urgence de votre pays.' }];
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

const A = {
  relay: { key: 'relay', label: 'Demander un relais', detail: 'Prévenir votre foyer que vous avez besoin d’être relayée — seulement si vous le choisissez.', to: '/postpartum/sharing' },
  rest: { key: 'rest', label: 'Réserver un moment de repos', detail: 'Bloquer un créneau, même court, et le noter pour vous en souvenir.', to: '/postpartum/support' },
  postpone: { key: 'postpone', label: 'Laisser de côté ce qui peut attendre', detail: 'Le ménage, les messages, les visites : tout cela peut attendre.' },
  delegate: { key: 'delegate', label: 'Confier une tâche pratique', detail: 'Courses, repas, linge : votre plan de soutien liste ce qu’on peut prendre pour vous.', to: '/postpartum/support' },
  talkPartner: { key: 'talk_partner', label: 'Prendre un moment pour en parler', detail: 'Avec votre conjoint ou une personne de confiance, quand cela vous convient.' },
  trusted: { key: 'trusted', label: 'Appeler une personne de confiance', detail: 'Vos contacts sont à portée de main.', to: '/postpartum/support' },
  pro: { key: 'pro', label: 'Contacter une sage-femme ou un médecin', detail: 'Votre sage-femme, votre médecin traitant ou la PMI peuvent vous écouter et vous orienter.', to: '/postpartum/support' },
  proSoon: { key: 'pro_soon', label: 'En parler rapidement à un professionnel', detail: 'Sans attendre la prochaine visite prévue : une sage-femme, un médecin ou un psychologue peuvent vous aider.', to: '/postpartum/support' },
  notes: { key: 'notes', label: 'Préparer quelques notes pour la consultation', detail: 'Ce que vous ressentez, depuis quand, vos questions.', to: '/postpartum/support' },
  understand: { key: 'understand', label: 'Comprendre ce que vous traversez', detail: 'Baby blues, fatigue, signes qui méritent d’en parler : des repères sourcés.', to: '/postpartum/understand' },
} satisfies Record<string, SupportAction>;

const low = (v: number | null | undefined) => v != null && v <= 2;
const high = (v: number | null | undefined) => v != null && v >= 4;

/**
 * Propositions graduées à partir de ce que la mère a déclaré AUJOURD'HUI (§ 22.5), plus
 * la persistance éventuelle sur plusieurs jours (jamais une seule réponse).
 * `danger` provient uniquement des questions de sécurité qu'elle a cochées elle-même.
 */
export function supportPlan(c: Partial<CheckinInput>, opts: { danger?: DangerKey[]; persistentLowDays?: number; country?: string } = {}): SupportPlan {
  if (opts.danger && opts.danger.length > 0) {
    return {
      level: 'danger',
      title: 'Vous méritez d’être aidée tout de suite',
      message: 'Ce que vous vivez est sérieux, et vous n’avez pas à le porter seule. Appelez maintenant un des numéros ci-dessous. Si vous le pouvez, demandez à quelqu’un de rester avec vous et de garder le bébé en sécurité.',
      actions: emergencyContacts(opts.country ?? 'FR').map((e) => ({ key: `call_${e.phone}`, label: `Appeler le ${e.phone} — ${e.label}`, detail: e.when, to: `call:${e.phone}` })),
    };
  }
  const needs = new Set(c.needs ?? []);
  const sad = low(c.feeling) || low(c.mood);
  const persistent = (opts.persistentLowDays ?? 0) >= 5;
  const strained = high(c.fatigue) || high(c.stress) || low(c.coping) || high(c.help_need);

  if (persistent || (sad && (low(c.coping) || high(c.stress)))) {
    return {
      level: 'distress',
      title: persistent ? 'Cela dure depuis plusieurs jours' : 'Aujourd’hui a l’air vraiment lourd',
      message: persistent
        ? 'Vous avez noté plusieurs journées difficiles. Ce n’est pas un échec, et cela ne dit pas ce que vous avez : c’est une bonne raison d’en parler à un professionnel, sans attendre si c’est intense.'
        : 'Merci de l’avoir noté. Quand c’est aussi lourd, en parler à un professionnel peut vraiment aider — vous n’avez pas besoin d’attendre que ça dure.',
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
      title: 'Allégeons un peu la journée',
      message: 'Fatigue et stress sont fréquents après une naissance, et ils comptent. Voici quelques pistes — prenez celles qui vous aident.',
      actions: dedupe(actions),
    };
  }
  if (needs.has('rest') || needs.has('relay') || needs.has('practical') || high(c.rest_need)) {
    const actions: SupportAction[] = [];
    if (needs.has('relay')) actions.push(A.relay);
    if (needs.has('rest') || high(c.rest_need)) actions.push(A.rest, A.relay);
    if (needs.has('practical')) actions.push(A.delegate);
    actions.push(A.postpone);
    return { level: 'rest', title: 'Votre besoin de repos est légitime', message: 'Voici de quoi vous faire relayer ou souffler un peu.', actions: dedupe(actions) };
  }
  return { level: 'none', title: 'Merci d’avoir pris ce moment', message: 'Rien d’autre à faire : revenez quand vous voulez, ou pas du tout.', actions: [] };
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
  if (vals.length < 3) return 'Pas assez de jours notés pour voir une évolution — et ce n’est pas grave.';
  const half = Math.floor(vals.length / 2);
  const first = avg(vals.slice(0, half));
  const last = avg(vals.slice(half));
  const delta = last - first;
  if (Math.abs(delta) < 0.5) return 'Plutôt stable sur la période notée.';
  const better = positive ? delta > 0 : delta < 0;
  return better ? 'Un peu plus léger ces derniers jours, d’après vos réponses.' : 'Un peu plus lourd ces derniers jours, d’après vos réponses.';
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

export const REST_LABEL: Record<NonNullable<SharedStatus['rest_need']>, string> = {
  none: 'Pas de besoin particulier', some: 'A besoin de souffler', high: 'A vraiment besoin de repos',
};
export const AVAILABILITY_LABEL: Record<NonNullable<SharedStatus['availability']>, string> = {
  available: 'Disponible', resting: 'Se repose', unavailable: 'Pas disponible pour le moment',
};

/**
 * « Comment m'aider ? » : gestes concrets proposés au conjoint, à partir de ce que la mère a CHOISI
 * de partager. Aucune interprétation de ses réponses privées (il n'y a pas accès).
 */
export function helpIdeas(s: Pick<SharedStatus, 'rest_need' | 'availability' | 'relay_requested'>): string[] {
  const ideas: string[] = [];
  if (s.relay_requested) ideas.push('Prendre le relais avec le bébé dès que possible, et le lui confirmer.');
  if (s.rest_need === 'high' || s.rest_need === 'some') {
    ideas.push('Lui proposer un créneau de sommeil protégé : vous gérez le bébé, le téléphone et la porte.');
    ideas.push('Prendre une nuit, ou une partie de la nuit.');
  }
  if (s.availability === 'resting' || s.availability === 'unavailable') ideas.push('Éviter de la solliciter pour le moment ; les questions peuvent attendre.');
  ideas.push('Prendre en charge un repas, les courses ou le linge sans qu’elle ait à le demander.');
  ideas.push('Lui demander : « Qu’est-ce que je peux prendre en charge pour te laisser souffler ? »');
  return [...new Set(ideas)];
}

// ------------------------------------------------------------------ démarches
export const ACTION_KINDS: { value: 'appointment_booked' | 'professional_contacted' | 'talked' | 'rest_taken' | 'relay_received' | 'other'; label: string }[] = [
  { value: 'appointment_booked', label: 'J’ai pris un rendez-vous' },
  { value: 'professional_contacted', label: 'J’ai contacté un professionnel' },
  { value: 'talked', label: 'J’en ai parlé à quelqu’un' },
  { value: 'rest_taken', label: 'J’ai pris du repos' },
  { value: 'relay_received', label: 'J’ai été relayée' },
  { value: 'other', label: 'Autre démarche' },
];

/** Idées de besoins de repos et de tâches à déléguer pour préparer le plan de soutien (avant ou après la naissance). */
export const PLAN_REST_IDEAS = ['Une sieste protégée chaque jour', 'Une nuit complète par semaine', 'Une douche tranquille', 'Sortir marcher seule', 'Limiter les visites'];
export const PLAN_TASK_IDEAS = ['Courses', 'Repas', 'Linge', 'Ménage', 'Rendez-vous administratifs', 'Aînés : école et activités', 'Accueillir les visites', 'Biberons de nuit'];
