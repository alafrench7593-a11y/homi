/**
 * « À savoir aujourd'hui », situation d'un rapport et informations de contraception d'urgence (logique pure, testée).
 *
 * Principes (non négociables) :
 *  - Information générale pendant les premiers cycles ; « tendance observée dans tes données » seulement après
 *    plusieurs observations comparables (≥ 3 cycles complets, ≥ 2 occurrences, au moins la moitié des cycles).
 *  - Jamais de lien de cause, jamais « tu as ovulé » / « tu es enceinte », jamais « aucun risque ».
 *  - Un symptôme nouveau, très intense ou persistant n'est pas banalisé : information de sécurité et professionnel.
 *  - L'anticipation (Premium) dit « souvent », jamais « tu vas avoir ».
 *  - Les informations de contraception d'urgence sont toujours gratuites.
 * Les textes sont des clés de traduction (c3.*) ; seuls les paramètres sont calculés ici.
 */
import { fertileStatusOn } from '../advice/engine';
import type { CycleEstimate, PeriodEntry } from './cycle';
import { addDays, daysBetween } from './dates';
import { periodOn } from './cycleDaily';

export type Phase = 'period' | 'beforePeriod' | 'fertile' | 'other' | 'unknown';
export interface LogDay { date: string; items: string[]; pain?: number | null }
export type InsightKind = 'general' | 'trend' | 'safety' | 'anticipation' | 'emergency';
export interface Insight {
  id: string; // clé stable pour les retours (« Cette information m'aide » / « Cela ne me correspond pas »)
  kind: InsightKind;
  key: string; // clé de traduction
  params: Record<string, string | number>;
  action?: 'professional' | 'addSleep' | 'reminder' | 'emergency' | 'summary';
  symptom?: string;
  trendLocked?: boolean; // une tendance existe mais elle est réservée au Premium
}

/** Symptômes suivis pour les tendances (pas les humeurs une à une : regroupées en « humeur fragile »). */
export const TREND_ITEMS = ['cramps', 'back_pain', 'migraine', 'headache', 'pelvic_pain', 'breast_tenderness', 'fatigue', 'bloating', 'nausea', 'acne', 'cravings', 'digestion', 'difficult', 'mood_low'] as const;
const LOW_MOODS = new Set(['sensitive', 'irritable', 'anxious', 'sad', 'stressed', 'low']);
const normalize = (items: string[]) => {
  const out = new Set(items);
  if (items.some((x) => LOW_MOODS.has(x))) out.add('mood_low');
  return out;
};

export function phaseOn(iso: string, periods: PeriodEntry[], est: CycleEstimate): Phase {
  if (periodOn(periods as never, iso)) return 'period';
  if (!est.nextPeriod) return 'unknown';
  const until = daysBetween(iso, est.nextPeriod);
  if (until >= 1 && until <= 5) return 'beforePeriod';
  if (est.fertileWindow && est.fertileWindow.start <= iso && iso <= est.fertileWindow.end) return 'fertile';
  return 'other';
}

/** Cycles complets (début → début suivant), du plus récent au plus ancien. */
export function completedCycles(periods: PeriodEntry[]): { start: string; next: string }[] {
  const starts = [...new Set(periods.map((p) => p.start_date))].sort();
  const out: { start: string; next: string }[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    const len = daysBetween(starts[i], starts[i + 1]);
    if (len >= 15 && len <= 60) out.push({ start: starts[i], next: starts[i + 1] });
  }
  return out.reverse();
}

export interface Trend { item: string; phase: 'beforePeriod' | 'period'; count: number; total: number; typicalLead: number | null }

/**
 * Tendances personnelles : un élément noté dans la même phase (5 jours avant les règles, ou pendant) lors d'au moins
 * 2 des 6 derniers cycles complets, et au moins la moitié d'entre eux (3 cycles complets minimum).
 */
export function trends(periods: PeriodEntry[], logs: LogDay[], maxCycles = 6): Trend[] {
  const cycles = completedCycles(periods).slice(0, maxCycles);
  if (cycles.length < 3) return [];
  const byDate = new Map(logs.map((l) => [l.date, normalize(l.items)]));
  const out: Trend[] = [];
  for (const item of TREND_ITEMS) {
    for (const phase of ['beforePeriod', 'period'] as const) {
      let count = 0;
      const leads: number[] = [];
      for (const c of cycles) {
        let seen = false;
        if (phase === 'beforePeriod') {
          for (let k = 1; k <= 5; k++) {
            if (byDate.get(addDays(c.next, -k))?.has(item)) { seen = true; leads.push(k); break; }
          }
        } else {
          for (let k = 0; k < 5; k++) if (byDate.get(addDays(c.start, k))?.has(item)) { seen = true; break; }
        }
        if (seen) count++;
      }
      if (count >= 2 && count / cycles.length >= 0.5) {
        const typicalLead = leads.length ? Math.round(leads.reduce((a, b) => a + b, 0) / leads.length) : null;
        out.push({ item, phase, count, total: cycles.length, typicalLead });
      }
    }
  }
  return out.sort((a, b) => b.count / b.total - a.count / a.total);
}

export interface InsightInput {
  today: string;
  periods: PeriodEntry[];
  est: CycleEstimate;
  logs: LogDay[]; // toutes les journées notées (aujourd'hui compris)
  todayItems: string[]; // éléments notés aujourd'hui
  todayPain: number | null;
  goal: 'cycle' | 'ttc' | 'avoid';
  premium: boolean;
  feedback: Record<string, 'helpful' | 'not_me'>;
  /** Signes préoccupants déclarés (ex. fièvre, malaise) : jamais déduits. */
  concerning?: boolean;
}

const PAIN_ITEMS = new Set(['cramps', 'back_pain', 'migraine', 'headache', 'pelvic_pain', 'breast_tenderness', 'dyspareunia', 'pain_other', 'ovulation_pain']);

/** Candidats classés ; le premier non écarté par un retour « Cela ne me correspond pas » est affiché. */
export function insightCandidates(i: InsightInput): Insight[] {
  const out: Insight[] = [];
  const phase = phaseOn(i.today, i.periods, i.est);
  const until = i.est.nextPeriod ? daysBetween(i.today, i.est.nextPeriod) : null;
  const today = normalize(i.todayItems);
  const history = i.logs.filter((l) => l.date < i.today);
  const everSeen = (item: string) => history.some((l) => normalize(l.items).has(item));
  const allTrends = trends(i.periods, i.logs);
  const trendOf = (item: string, p: 'beforePeriod' | 'period') => allTrends.find((x) => x.item === item && x.phase === p) ?? null;
  const cyclesDone = completedCycles(i.periods).length;

  // 1. Sécurité : jamais écartée par un retour, toujours en premier
  if (i.concerning) out.push({ id: 'safety:concerning', kind: 'safety', key: 'c3.ins.safetyConcerning', params: {}, action: 'professional' });
  if ((i.todayPain ?? 0) >= 8 && i.todayItems.some((x) => PAIN_ITEMS.has(x))) out.push({ id: 'safety:pain', kind: 'safety', key: 'c3.ins.safetyPain', params: {}, action: 'professional' });
  const newIntense = i.todayItems.find((x) => PAIN_ITEMS.has(x) && (i.todayPain ?? 0) >= 6 && !everSeen(x) && history.length >= 14);
  if (newIntense) out.push({ id: `safety:new:${newIntense}`, kind: 'safety', key: 'c3.ins.safetyNew', params: { symptom: newIntense }, action: 'professional', symptom: newIntense });
  const persistent = i.todayItems.find((x) => PAIN_ITEMS.has(x) && [1, 2, 3, 4, 5, 6].every((k) => i.logs.some((l) => l.date === addDays(i.today, -k) && l.items.includes(x))));
  if (persistent) out.push({ id: `safety:persist:${persistent}`, kind: 'safety', key: 'c3.ins.safetyPersistent', params: { symptom: persistent }, action: 'professional', symptom: persistent });
  if (i.todayItems.includes('flow_heavy')) out.push({ id: 'safety:heavy', kind: 'safety', key: 'c3.ins.heavyFlow', params: {}, action: 'professional' });
  if (i.todayItems.includes('preg_positive')) out.push({ id: 'safety:pregPositive', kind: 'safety', key: 'c3.ins.pregPositive', params: {}, action: 'professional' });

  // 2. Urgence (rapport non protégé, incident, oubli) : toujours affichée, gratuite
  if (i.todayItems.some((x) => x === 'sex_unprotected' || x === 'sex_incident' || x === 'sex_forgot' || x === 'pill_missed')) {
    out.push({ id: 'emergency', kind: 'emergency', key: 'c3.ins.emergency', params: {}, action: 'emergency' });
  }

  // 3. Selon ce qui a été noté aujourd'hui
  const pushTrendOrGeneral = (item: string, generalKey: string, generalParams: Record<string, string | number> = {}, action?: Insight['action']) => {
    const t = phase === 'beforePeriod' || phase === 'period' ? trendOf(item, phase) : null;
    if (t && i.premium && cyclesDone >= 3) {
      const key = item === 'fatigue' && phase === 'beforePeriod' ? 'c3.ins.trendFatigue'
        : item === 'migraine' ? 'c3.ins.trendMigraine'
          : item === 'mood_low' ? 'c3.ins.trendMood'
            : phase === 'beforePeriod' ? 'c3.ins.trendBefore' : 'c3.ins.trendDuring';
      out.push({ id: `trend:${item}:${phase}`, kind: 'trend', key, params: { symptom: item, count: t.count, total: t.total }, symptom: item, action: item === 'migraine' ? 'summary' : item === 'mood_low' ? 'addSleep' : undefined });
    }
    out.push({ id: `general:${item}:${phase}`, kind: 'general', key: generalKey, params: generalParams, symptom: item, action, trendLocked: !!t && !i.premium });
  };
  if (today.has('back_pain') && phase === 'beforePeriod' && until != null) pushTrendOrGeneral('back_pain', 'c3.ins.backPainBefore', { count: until });
  if (today.has('fatigue')) pushTrendOrGeneral('fatigue', phase === 'beforePeriod' ? 'c3.ins.fatigueBefore' : 'c3.ins.fatigue');
  if (today.has('migraine')) pushTrendOrGeneral('migraine', 'c3.ins.migraine', {}, 'summary');
  if (today.has('mood_low')) pushTrendOrGeneral('mood_low', 'c3.ins.mood', {}, 'addSleep');
  if (today.has('mucus_egg_white')) out.push({ id: `general:mucus:${phase === 'fertile' ? 'in' : 'out'}`, kind: 'general', key: phase === 'fertile' ? 'c3.ins.mucusFertile' : 'c3.ins.mucusOutside', params: {} });
  if (today.has('cramps')) pushTrendOrGeneral('cramps', phase === 'period' || phase === 'beforePeriod' ? 'c3.ins.crampsPeriod' : 'c3.ins.crampsOther');
  for (const item of ['back_pain', 'headache', 'pelvic_pain', 'breast_tenderness', 'bloating', 'acne', 'nausea', 'cravings', 'digestion', 'difficult'] as const) {
    if (today.has(item) && !out.some((x) => x.symptom === item)) pushTrendOrGeneral(item, 'c3.ins.symptomGeneral', { symptom: item });
  }

  // 4. Anticipation (Premium) : avant les règles estimées, un élément souvent noté à ce moment
  if (until != null && until >= 1 && until <= 5) {
    const t = allTrends.find((x) => x.phase === 'beforePeriod' && !today.has(x.item));
    if (t && i.premium) {
      out.push({ id: `anticipation:${t.item}`, kind: 'anticipation', key: t.typicalLead ? 'c3.ins.anticipateLead' : 'c3.ins.anticipate', params: { symptom: t.item, count: t.typicalLead ?? 0 }, symptom: t.item });
    }
    out.push({ id: 'anticipation:reminder', kind: 'general', key: 'c3.ins.periodSoon', params: { count: until }, action: 'reminder', trendLocked: !!t && !i.premium });
  }

  // 5. Carte générale selon la phase et l'objectif
  if (!i.periods.length) out.push({ id: 'general:start', kind: 'general', key: 'c3.ins.start', params: {} });
  else if (i.est.reliability === 'insufficient') out.push({ id: 'general:few', kind: 'general', key: 'c3.ins.fewCycles', params: {} });
  if (phase === 'period') out.push({ id: 'general:period', kind: 'general', key: 'c3.ins.phasePeriod', params: {} });
  if (phase === 'fertile') out.push({ id: `general:fertile:${i.goal}`, kind: 'general', key: i.goal === 'ttc' ? 'c3.ins.fertileTtc' : i.goal === 'avoid' ? 'c3.ins.fertileAvoid' : 'c3.ins.fertile', params: {} });
  out.push({ id: `general:default:${i.goal}`, kind: 'general', key: `c3.ins.default_${i.goal}`, params: {} });
  return out;
}

export function todayInsight(i: InsightInput): Insight {
  const list = insightCandidates(i);
  return list.find((x) => x.kind === 'safety' || x.kind === 'emergency' || i.feedback[x.id] !== 'not_me') ?? list[list.length - 1];
}

/** Libellé de la carte selon le type (« Information générale » ou « Tendance observée dans tes données »). */
export const INSIGHT_BADGE: Record<InsightKind, string> = {
  general: 'c3.badge.general', trend: 'c3.badge.trend', anticipation: 'c3.badge.trend', safety: 'c3.badge.safety', emergency: 'c3.badge.emergency',
};

// ─── Rapport : situation dans le cycle ─────────────────────────────────────────────────────────────

export type IntercourseSituation = 'fertile' | 'near' | 'outside' | 'insufficient';
export interface IntercourseInfo {
  situation: IntercourseSituation;
  textKey: string; // textes exacts fournis (c3.sex.*)
  protectionDeclared: boolean;
  needsEmergencyInfo: boolean;
  hoursSince: number;
}

export function intercourseInfo(
  date: string, periods: PeriodEntry[], est: CycleEstimate,
  flags: { protected: boolean; condom: boolean; contraception: boolean; incident: boolean; forgot: boolean; unprotected: boolean; time?: string | null },
  now: Date = new Date(),
): IntercourseInfo {
  const st = periods.length ? fertileStatusOn(periods, date, est.averageLength, est.reliability).status : 'unknown';
  const situation: IntercourseSituation = st === 'in' ? 'fertile' : st === 'near' ? 'near' : st === 'out' ? 'outside' : 'insufficient';
  const textKey = situation === 'fertile' ? 'c3.sex.fertile' : situation === 'insufficient' ? 'c3.sex.insufficient' : 'c3.sex.outside';
  const protectionDeclared = (flags.protected || flags.condom || flags.contraception) && !flags.unprotected;
  // Heure du rapport si elle est notée, sinon midi (jamais dans le futur)
  const at = new Date(`${date}T${flags.time && /^\d{2}:\d{2}/.test(flags.time) ? flags.time.slice(0, 5) : '12:00'}:00`);
  const hoursSince = Math.max(0, Math.round((now.getTime() - at.getTime()) / 3600000));
  return { situation, textKey, protectionDeclared, needsEmergencyInfo: flags.unprotected || flags.incident || flags.forgot, hoursSince };
}

// ─── Contraception d'urgence (information officielle, gratuite) ─────────────────────────────────────

export const EC_SOURCES = [
  { id: 'santeFr', org: 'Santé.fr (ministère de la Santé)', titleKey: 'c3.ec.src.santeFr', url: 'https://www.sante.fr/node/1253263', published: '2024-06-18', checked: '2026-10-22' },
  { id: 'cnam', org: 'Assurance Maladie (Cnam) · Cespharm', titleKey: 'c3.ec.src.cnam', url: 'https://www.cespharm.fr/content/download/53727/file/la-contraception-d-urgence-depliant-2023.pdf', published: '2023-07-01', checked: '2026-10-22' },
] as const;
/** Délais officiels (heures après le rapport). */
export const EC_DELAYS = [
  { id: 'levonorgestrel', hours: 72, key: 'c3.ec.lng' },
  { id: 'ulipristal', hours: 120, key: 'c3.ec.upa' },
  { id: 'iud', hours: 120, key: 'c3.ec.iud' },
] as const;
export const EC_PHONES = [
  { id: 'scivg', number: '0 800 08 11 11', key: 'c3.ec.phoneScivg' },
  { id: 'fsj', number: '0 800 235 236', key: 'c3.ec.phoneFsj' },
] as const;

/** Options encore dans leur délai officiel (le plus tôt est le mieux, sans jamais dire « trop tard » pour tout). */
export function ecWindows(hoursSince: number) {
  return EC_DELAYS.map((d) => ({ ...d, open: hoursSince <= d.hours, hoursLeft: Math.max(0, d.hours - hoursSince) }));
}
/** Date indicative pour un test de grossesse : 3 semaines après le rapport (source Cnam). */
export const pregnancyTestFrom = (sexDate: string) => addDays(sexDate, 21);

// ─── Garde-fou du texte de l'assistant ─────────────────────────────────────────────────────────────

/** Formulations interdites dans les réponses de l'assistant (contraception d'urgence, certitudes médicales). */
export const FORBIDDEN_CLAIMS: RegExp[] = [
  /contraception d['’]urgence (est |serait )?(inutile|pas utile|pas nécessaire|ne sert à rien)/i,
  /(pas|aucun) besoin (de|d['’]une?) (contraception d['’]urgence|pilule du lendemain)/i,
  /pilule du lendemain (est |serait )?(inutile|pas utile|pas nécessaire)/i,
  /aucun risque/i, /jours? sans (danger|risque)/i, /grossesse (est )?impossible/i,
  /tu as ovulé/i, /tu es enceinte/i, /vous avez ovulé/i, /vous êtes enceinte/i,
  /forcément normal/i, /(pas|aucun) besoin de consulter/i, /problème hormonal/i,
];
export const hasForbiddenClaim = (text: string) => FORBIDDEN_CLAIMS.some((r) => r.test(text));
