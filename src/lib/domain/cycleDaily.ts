/**
 * « Suivre mon cycle » : saisie du jour en quelques secondes (logique pure, testée).
 *  - Catégories et pastilles (règles, douleurs, humeur, corps, sommeil, pertes et fertilité, vie sexuelle,
 *    contraception et traitements, habitudes, notes), mêmes valeurs que la base (20261024000100_cycle_v3.sql).
 *  - Favoris (5) selon l'objectif : suivre son cycle, concevoir, gérer sa contraception.
 *  - État d'une journée lu depuis les tables existantes, et plan d'enregistrement (insertions, mises à jour,
 *    suppressions) pour passer d'un état à l'autre — les prévisions se recalculent ensuite d'elles-mêmes.
 *  - Résumé du jour (« Aujourd'hui, tu as noté : … ») et cellules du calendrier (codes visuels).
 * Aucune donnée n'est interprétée comme un diagnostic ; un test saisi reste un résultat saisi.
 */
import { type CycleEstimate, type PeriodEntry } from './cycle';
import { addDays, daysBetween } from './dates';
import { formatNumber } from '@/i18n';

export type Goal = 'cycle' | 'ttc' | 'avoid';
export type CategoryKey = 'period' | 'pain' | 'mood' | 'body' | 'sleep' | 'fertility' | 'intimacy' | 'contraception' | 'habits' | 'notes';
export const CATEGORIES: CategoryKey[] = ['period', 'pain', 'mood', 'body', 'sleep', 'fertility', 'intimacy', 'contraception', 'habits', 'notes'];

/** Pastilles de chaque catégorie (identifiants stables ; libellés : c3.p.<id>). */
export const PILLS: Record<CategoryKey, string[]> = {
  period: ['period_start', 'period_end', 'flow_light', 'flow_medium', 'flow_heavy', 'spotting', 'leak'],
  pain: ['cramps', 'back_pain', 'migraine', 'headache', 'pelvic_pain', 'breast_tenderness', 'dyspareunia', 'pain_other'],
  mood: ['happy', 'calm', 'energetic', 'sensitive', 'irritable', 'anxious', 'sad', 'stressed', 'low', 'stable'],
  body: ['bloating', 'fatigue', 'nausea', 'cravings', 'appetite_loss', 'acne', 'skin', 'digestion', 'constipation', 'diarrhea', 'dizziness', 'hot_flashes', 'swelling', 'other'],
  sleep: ['restful', 'difficult', 'nap'],
  fertility: ['mucus_dry', 'mucus_creamy', 'mucus_watery', 'mucus_egg_white', 'ovu_positive', 'ovu_negative', 'ovu_uncertain', 'ovulation_pain', 'preg_positive', 'preg_negative', 'preg_uncertain'],
  intimacy: ['sex_logged', 'sex_protected', 'sex_unprotected', 'sex_condom', 'sex_contraception', 'sex_incident', 'sex_forgot', 'libido_up', 'libido_down', 'discomfort'],
  contraception: ['pill_taken', 'pill_missed', 'patch_changed', 'ring_inserted', 'ring_removed', 'condom', 'device_declared', 'emergency_taken', 'treatment', 'effect'],
  habits: ['sport', 'walk', 'hydration', 'alcohol', 'tobacco', 'stress_day', 'travel', 'night_work', 'illness', 'event'],
  notes: [],
};
/** Groupes où un seul choix est possible. */
export const EXCLUSIVE: string[][] = [
  ['flow_light', 'flow_medium', 'flow_heavy'],
  ['mucus_dry', 'mucus_creamy', 'mucus_watery', 'mucus_egg_white'],
  ['ovu_positive', 'ovu_negative', 'ovu_uncertain'],
  ['preg_positive', 'preg_negative', 'preg_uncertain'],
  ['sex_protected', 'sex_unprotected'],
  ['restful', 'difficult'],
  ['pill_taken', 'pill_missed'],
];
/** Pastilles « vie sexuelle » : masquées si le suivi intime n'est pas activé, jamais dans une notification. */
export const INTIMATE_PILLS = new Set(['sex_logged', 'dyspareunia', 'libido_up', 'libido_down', 'discomfort', 'sex_protected', 'sex_unprotected', 'sex_condom', 'sex_contraception', 'sex_incident', 'sex_forgot']);
export const categoryOf = (pill: string): CategoryKey | null => CATEGORIES.find((c) => PILLS[c].includes(pill)) ?? null;

export const PILL_ICON: Record<CategoryKey, string> = {
  period: 'droplet', pain: 'zap', mood: 'smile', body: 'activity', sleep: 'moon', fertility: 'sun', intimacy: 'heart', contraception: 'shield', habits: 'coffee', notes: 'edit-3',
};
/**
 * Couleurs douces des catégories (HOMI, 13/11/2026 : framboise, ambre et champagne remplacent la terre cuite,
 * le corail et le cuivre de l'ancienne marque). Encre ≥ 4,5:1 sur son fond (testé).
 */
export const CATEGORY_TINT: Record<CategoryKey, { bg: string; ink: string }> = {
  period: { bg: '#F7E6EF', ink: '#A8346A' }, pain: { bg: '#F2EEF7', ink: '#8A5A0E' }, mood: { bg: '#F6ECDA', ink: '#76561D' }, body: { bg: '#EAF7EC', ink: '#3C8C55' },
  sleep: { bg: '#EEEAFF', ink: '#6A52D6' }, fertility: { bg: '#F1ECFF', ink: '#5E4CC2' }, intimacy: { bg: '#F3E8F6', ink: '#8A3F9A' }, contraception: { bg: '#E9F4FF', ink: '#3A78B5' },
  habits: { bg: '#E6F6F4', ink: '#2A8A80' }, notes: { bg: '#EEF2F6', ink: '#5B6B7C' },
};

// ─── Favoris ───────────────────────────────────────────────────────────────────────────────────────

/** Raccourcis possibles : une catégorie, ou une saisie précise mise en avant selon l'objectif. */
export const SHORTCUTS = [...CATEGORIES.filter((c) => c !== 'notes'), 'notes', 'mucus', 'temperature', 'ovulation_test', 'pregnancy_test', 'intercourse', 'pill', 'missed_pill', 'incident', 'reminders'] as const;
export type Shortcut = (typeof SHORTCUTS)[number];
export const MAX_FAVORITES = 5;
/** Objectif → raccourcis mis en avant (jamais toutes les catégories avec la même importance). */
export const GOAL_FAVORITES: Record<Goal, Shortcut[]> = {
  cycle: ['period', 'pain', 'mood', 'body', 'sleep'],
  ttc: ['period', 'mucus', 'ovulation_test', 'intercourse', 'pregnancy_test'],
  avoid: ['pill', 'missed_pill', 'incident', 'intercourse', 'period'],
};
/** Suggestions supplémentaires proposées lors du choix (par objectif). */
export const GOAL_SUGGESTED: Record<Goal, Shortcut[]> = {
  cycle: ['period', 'pain', 'mood', 'body', 'sleep', 'habits', 'contraception', 'notes'],
  ttc: ['period', 'mucus', 'ovulation_test', 'temperature', 'intercourse', 'pregnancy_test', 'mood', 'pain'],
  avoid: ['pill', 'missed_pill', 'incident', 'intercourse', 'period', 'reminders', 'contraception', 'mood'],
};
const INTIMATE_SHORTCUTS = new Set<string>(['intimacy', 'intercourse', 'incident']);

/** Favoris effectifs : choix de la personne (5 au plus), sinon ceux de l'objectif ; sans la vie sexuelle si elle est masquée. */
export function effectiveFavorites(goal: Goal, chosen: string[] | null | undefined, intimateEnabled: boolean): Shortcut[] {
  const base = (chosen?.length ? chosen : GOAL_FAVORITES[goal]).filter((s): s is Shortcut => (SHORTCUTS as readonly string[]).includes(s));
  return base.filter((s) => intimateEnabled || !INTIMATE_SHORTCUTS.has(s)).slice(0, MAX_FAVORITES);
}
/** Catégorie ouverte par un raccourci. */
export function shortcutCategory(s: Shortcut): CategoryKey | 'reminders' {
  switch (s) {
    case 'mucus': case 'temperature': case 'ovulation_test': case 'pregnancy_test': return 'fertility';
    case 'intercourse': case 'incident': return 'intimacy';
    case 'pill': case 'missed_pill': return 'contraception';
    case 'reminders': return 'reminders';
    default: return s;
  }
}
/** Ordre des catégories dans « Voir toutes les catégories » : celles de l'objectif d'abord. */
export function categoryOrder(goal: Goal, intimateEnabled: boolean): CategoryKey[] {
  const first: Record<Goal, CategoryKey[]> = {
    cycle: ['period', 'pain', 'mood', 'body', 'sleep'],
    ttc: ['period', 'fertility', 'intimacy', 'mood', 'pain'],
    avoid: ['contraception', 'intimacy', 'period', 'mood', 'pain'],
  };
  const order = [...first[goal], ...CATEGORIES.filter((c) => !first[goal].includes(c))];
  return order.filter((c) => intimateEnabled || c !== 'intimacy');
}

// ─── État d'une journée ────────────────────────────────────────────────────────────────────────────

export interface SymptomRow {
  id: string; logged_on: string; symptom_keys?: string[] | null; moods?: string[] | null; habits?: string[] | null; tags?: string[] | null;
  pain_intensity?: number | null; sleep?: number | null; energy?: number | null; fatigue?: number | null; sleep_bedtime?: string | null; sleep_waketime?: string | null;
  night_wakings?: number | null; nap?: boolean | null; sleep_tags?: string[] | null; period_color?: string | null; protection?: string | null; leak?: boolean | null;
  spotting?: boolean | null; note?: string | null; photo_path?: string | null; custom_items?: string[] | null;
}
export interface DaySources {
  periods: (PeriodEntry & { id: string; flow?: string | null })[];
  symptom?: SymptomRow | null;
  fertility?: { id: string; observed_on: string; cervical_mucus?: string | null; bbt_celsius?: number | null } | null;
  ovulationTests: { id: string; tested_at: string; result: string }[];
  pregnancyTests: { id: string; tested_at: string; result: string }[];
  intercourse: { id: string; occurred_on: string; occurred_time?: string | null; condom?: string | null; condom_incident?: string | null; usual_contraception?: string | null; contraception_incident?: string | null; note?: string | null }[];
  contraception: { id: string; logged_on: string; kind: string; label?: string | null }[];
}
export interface DayState {
  pills: string[];
  painIntensity: number | null;
  sleepQuality: number | null; energy: number | null; fatigue: number | null;
  bedtime: string | null; waketime: string | null; wakings: number | null;
  color: string | null; protection: string | null;
  temperature: number | null;
  sexTime: string | null; sexNote: string | null;
  treatment: string | null;
  note: string; tags: string[]; customItems: string[]; photoPath: string | null;
}
export const emptyDay = (): DayState => ({
  pills: [], painIntensity: null, sleepQuality: null, energy: null, fatigue: null, bedtime: null, waketime: null, wakings: null,
  color: null, protection: null, temperature: null, sexTime: null, sexNote: null, treatment: null, note: '', tags: [], customItems: [], photoPath: null,
});

const SYMPTOM_PILLS = new Set([...PILLS.pain, ...PILLS.body, 'ovulation_pain', 'libido_up', 'libido_down', 'discomfort']);
const FLOW_OF: Record<string, string> = { flow_light: 'light', flow_medium: 'medium', flow_heavy: 'heavy' };
const MUCUS_OF: Record<string, string> = { mucus_dry: 'dry', mucus_creamy: 'creamy', mucus_watery: 'watery', mucus_egg_white: 'egg_white' };
const RESULT_OF: Record<string, string> = { positive: 'positive', negative: 'negative', uncertain: 'uncertain' };

/** Règles couvrant une date (début ≤ date ≤ fin, ou en cours depuis 10 jours au plus si la fin n'est pas notée). */
export function periodOn(periods: DaySources['periods'], iso: string) {
  return periods.find((p) => p.start_date <= iso && (p.end_date ? iso <= p.end_date : daysBetween(p.start_date, iso) <= 9)) ?? null;
}

export function readDay(iso: string, s: DaySources): DayState {
  const d = emptyDay();
  const add = (p: string) => { if (!d.pills.includes(p)) d.pills.push(p); };
  const per = periodOn(s.periods, iso);
  if (per) {
    if (per.start_date === iso) add('period_start');
    if (per.end_date === iso) add('period_end');
    const flowPill = Object.keys(FLOW_OF).find((k) => FLOW_OF[k] === per.flow);
    if (flowPill && per.start_date === iso) add(flowPill);
  }
  const sy = s.symptom;
  if (sy) {
    for (const k of sy.symptom_keys ?? []) if (SYMPTOM_PILLS.has(k)) add(k);
    for (const k of sy.moods ?? []) add(k);
    for (const k of sy.habits ?? []) add(k);
    for (const k of sy.sleep_tags ?? []) add(k);
    if (sy.nap) add('nap');
    if (sy.leak) add('leak');
    if (sy.spotting) add('spotting');
    d.painIntensity = sy.pain_intensity ?? null; d.sleepQuality = sy.sleep ?? null; d.energy = sy.energy ?? null; d.fatigue = sy.fatigue ?? null;
    d.bedtime = sy.sleep_bedtime?.slice(0, 5) ?? null; d.waketime = sy.sleep_waketime?.slice(0, 5) ?? null; d.wakings = sy.night_wakings ?? null;
    d.color = sy.period_color ?? null; d.protection = sy.protection ?? null; d.note = sy.note ?? ''; d.tags = sy.tags ?? []; d.customItems = sy.custom_items ?? [];
    d.photoPath = sy.photo_path ?? null;
  }
  if (s.fertility) {
    const m = Object.keys(MUCUS_OF).find((k) => MUCUS_OF[k] === s.fertility!.cervical_mucus);
    if (m) add(m);
    d.temperature = s.fertility.bbt_celsius ?? null;
  }
  const ovu = s.ovulationTests.find((x) => x.tested_at.slice(0, 10) === iso);
  if (ovu && RESULT_OF[ovu.result]) add(`ovu_${ovu.result}`);
  const preg = s.pregnancyTests.find((x) => x.tested_at.slice(0, 10) === iso);
  if (preg && RESULT_OF[preg.result]) add(`preg_${preg.result}`);
  const sex = s.intercourse.find((x) => x.occurred_on === iso);
  if (sex) {
    add('sex_logged');
    if (sex.condom === 'yes' || sex.usual_contraception === 'yes') add('sex_protected');
    else if (sex.condom === 'no' || sex.usual_contraception === 'no') add('sex_unprotected');
    if (sex.condom === 'yes') add('sex_condom');
    if (sex.usual_contraception === 'yes') add('sex_contraception');
    if (sex.condom_incident && sex.condom_incident !== 'none') add('sex_incident');
    if (sex.contraception_incident === 'missed') add('sex_forgot');
    d.sexTime = sex.occurred_time?.slice(0, 5) ?? null; d.sexNote = sex.note ?? null;
  }
  for (const c of s.contraception.filter((x) => x.logged_on === iso)) {
    add(c.kind);
    if (c.kind === 'treatment') d.treatment = c.label ?? null;
  }
  return d;
}

const SEX_DETAILS = new Set(['sex_protected', 'sex_unprotected', 'sex_condom', 'sex_contraception', 'sex_incident', 'sex_forgot']);

/** Applique une pastille (avec les choix exclusifs). */
export function togglePill(state: DayState, pill: string): DayState {
  const on = state.pills.includes(pill);
  let pills = on ? state.pills.filter((p) => p !== pill) : [...state.pills, pill];
  if (!on) {
    const group = EXCLUSIVE.find((g) => g.includes(pill));
    if (group) pills = pills.filter((p) => p === pill || !group.includes(p));
    // Un détail du rapport (protégé, préservatif…) implique le rapport lui-même
    if (SEX_DETAILS.has(pill) && !pills.includes('sex_logged')) pills = ['sex_logged', ...pills];
  } else if (pill === 'sex_logged') {
    pills = pills.filter((p) => !SEX_DETAILS.has(p));
  }
  return { ...state, pills };
}

// ─── Plan d'enregistrement ─────────────────────────────────────────────────────────────────────────

export type Op =
  | { table: string; op: 'insert'; values: Record<string, unknown> }
  | { table: string; op: 'update'; id: string; values: Record<string, unknown> }
  | { table: string; op: 'delete'; id: string };

const has = (s: DayState, p: string) => s.pills.includes(p);

/**
 * Opérations pour enregistrer une journée (comparée à son état précédent).
 * Règles : « commencées » crée un début (ou corrige un début proche), « terminées » ferme les règles en cours ;
 * retirer « commencées » supprime ce début ; un flux sur un jour sans règles en cours démarre des règles.
 */
export function planDay(iso: string, prev: DayState, next: DayState, s: DaySources, nowIso = new Date().toISOString()): Op[] {
  const ops: Op[] = [];
  // Règles
  const covering = periodOn(s.periods, iso);
  const startHere = s.periods.find((p) => p.start_date === iso) ?? null;
  const flowPill = Object.keys(FLOW_OF).find((k) => has(next, k));
  const wantsStart = has(next, 'period_start') || (!!flowPill && !covering);
  if (wantsStart && !startHere) {
    // Un début noté dans les 6 jours suivant un autre début non terminé : on corrige plutôt que de doubler
    const near = s.periods.find((p) => !p.end_date && Math.abs(daysBetween(p.start_date, iso)) <= 6 && p.start_date !== iso);
    if (near) ops.push({ table: 'period_entries', op: 'update', id: near.id, values: { start_date: iso, flow: flowPill ? FLOW_OF[flowPill] : near.flow ?? null } });
    else ops.push({ table: 'period_entries', op: 'insert', values: { start_date: iso, end_date: has(next, 'period_end') ? iso : null, flow: flowPill ? FLOW_OF[flowPill] : null } });
  } else if (startHere && has(prev, 'period_start') && !has(next, 'period_start') && !flowPill) {
    ops.push({ table: 'period_entries', op: 'delete', id: startHere.id });
  } else if (startHere && flowPill && FLOW_OF[flowPill] !== startHere.flow) {
    ops.push({ table: 'period_entries', op: 'update', id: startHere.id, values: { flow: FLOW_OF[flowPill] } });
  }
  if (has(next, 'period_end') && !has(prev, 'period_end')) {
    const open = covering ?? [...s.periods].filter((p) => p.start_date <= iso).sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    if (open && !(wantsStart && !startHere)) ops.push({ table: 'period_entries', op: 'update', id: open.id, values: { end_date: iso } });
  } else if (!has(next, 'period_end') && has(prev, 'period_end')) {
    const closed = s.periods.find((p) => p.end_date === iso);
    if (closed) ops.push({ table: 'period_entries', op: 'update', id: closed.id, values: { end_date: null } });
  }

  // Fiche du jour (symptômes, humeur, habitudes, sommeil, détails des règles, notes)
  const keys = next.pills.filter((p) => SYMPTOM_PILLS.has(p));
  const row = {
    logged_on: iso, symptom_keys: keys, moods: next.pills.filter((p) => PILLS.mood.includes(p)), habits: next.pills.filter((p) => PILLS.habits.includes(p)),
    sleep_tags: next.pills.filter((p) => p === 'restful' || p === 'difficult'), nap: has(next, 'nap') ? true : null, leak: has(next, 'leak') ? true : null,
    spotting: has(next, 'spotting') ? true : null, pain_intensity: next.painIntensity, sleep: next.sleepQuality, energy: next.energy, fatigue: next.fatigue,
    sleep_bedtime: next.bedtime, sleep_waketime: next.waketime, night_wakings: next.wakings, period_color: next.color, protection: next.protection,
    note: next.note.trim() || null, tags: next.tags, custom_items: next.customItems, photo_path: next.photoPath,
  };
  const empty = !keys.length && !row.moods.length && !row.habits.length && !row.sleep_tags.length && !row.nap && !row.leak && !row.spotting && row.pain_intensity == null
    && row.sleep == null && row.energy == null && row.fatigue == null && !row.sleep_bedtime && !row.sleep_waketime && row.night_wakings == null && !row.period_color
    && !row.protection && !row.note && !row.tags.length && !row.custom_items.length && !row.photo_path;
  if (s.symptom) {
    if (empty) ops.push({ table: 'symptom_logs', op: 'delete', id: s.symptom.id });
    else ops.push({ table: 'symptom_logs', op: 'update', id: s.symptom.id, values: row });
  } else if (!empty) ops.push({ table: 'symptom_logs', op: 'insert', values: row });

  // Pertes et température (une observation par jour)
  const mucusPill = Object.keys(MUCUS_OF).find((k) => has(next, k));
  const fert = { cervical_mucus: mucusPill ? MUCUS_OF[mucusPill] : null, bbt_celsius: next.temperature };
  if (s.fertility) {
    if (!fert.cervical_mucus && fert.bbt_celsius == null) ops.push({ table: 'fertility_observations', op: 'delete', id: s.fertility.id });
    else if (fert.cervical_mucus !== (s.fertility.cervical_mucus ?? null) || fert.bbt_celsius !== (s.fertility.bbt_celsius ?? null)) ops.push({ table: 'fertility_observations', op: 'update', id: s.fertility.id, values: fert });
  } else if (fert.cervical_mucus || fert.bbt_celsius != null) ops.push({ table: 'fertility_observations', op: 'insert', values: { observed_on: iso, ...fert } });

  // Tests (résultat saisi : jamais une confirmation)
  for (const [kind, table, list] of [['ovu', 'ovulation_tests', s.ovulationTests], ['preg', 'pregnancy_tests', s.pregnancyTests]] as const) {
    const pill = next.pills.find((p) => p.startsWith(`${kind}_`));
    const existing = list.find((x) => x.tested_at.slice(0, 10) === iso);
    const result = pill ? pill.slice(kind.length + 1) : null;
    if (existing && !result) ops.push({ table, op: 'delete', id: existing.id });
    else if (existing && result && existing.result !== result) ops.push({ table, op: 'update', id: existing.id, values: { result, user_confirmed: true } });
    else if (!existing && result) ops.push({ table, op: 'insert', values: { tested_at: iso === nowIso.slice(0, 10) ? nowIso : `${iso}T12:00:00.000Z`, result, user_confirmed: true, analysis_method: 'manual' } });
  }

  // Rapport (facultatif, privé)
  const sexOn = has(next, 'sex_logged') || [...SEX_DETAILS].some((p) => has(next, p));
  const sexRow = s.intercourse.find((x) => x.occurred_on === iso);
  const condom = has(next, 'sex_condom') ? 'yes' : has(next, 'sex_unprotected') ? 'no' : null;
  const sexValues = {
    occurred_on: iso, occurred_time: next.sexTime, note: next.sexNote?.trim() || null,
    condom, condom_incident: has(next, 'sex_incident') && condom === 'yes' ? 'broke' : condom === 'yes' ? 'none' : null,
    // « Protégé » sans autre précision : protection déclarée (contraception habituelle)
    usual_contraception: has(next, 'sex_contraception') || (has(next, 'sex_protected') && !has(next, 'sex_condom')) ? 'yes' : has(next, 'sex_unprotected') ? 'no' : null,
    contraception_incident: has(next, 'sex_forgot') ? 'missed' : has(next, 'sex_incident') && condom !== 'yes' ? 'other' : has(next, 'sex_contraception') ? 'none' : null,
  };
  if (sexRow && !sexOn) ops.push({ table: 'intercourse_logs', op: 'delete', id: sexRow.id });
  else if (sexRow && sexOn) ops.push({ table: 'intercourse_logs', op: 'update', id: sexRow.id, values: sexValues });
  else if (!sexRow && sexOn) ops.push({ table: 'intercourse_logs', op: 'insert', values: sexValues });

  // Contraception déclarée
  const today = s.contraception.filter((x) => x.logged_on === iso);
  for (const kind of PILLS.contraception) {
    const row2 = today.find((x) => x.kind === kind);
    const want = has(next, kind);
    if (row2 && !want) ops.push({ table: 'contraception_logs', op: 'delete', id: row2.id });
    else if (!row2 && want) ops.push({ table: 'contraception_logs', op: 'insert', values: { logged_on: iso, kind, label: kind === 'treatment' ? next.treatment?.trim() || null : null } });
    else if (row2 && want && kind === 'treatment' && (row2.label ?? null) !== (next.treatment?.trim() || null)) ops.push({ table: 'contraception_logs', op: 'update', id: row2.id, values: { label: next.treatment?.trim() || null } });
  }
  return ops;
}

// ─── Résumé du jour ────────────────────────────────────────────────────────────────────────────────

/** « Aujourd'hui, tu as noté : fatigue, crampes légères et sommeil difficile. » (libellés fournis par l'appelant). */
export function daySummaryItems(d: DayState, label: (pill: string) => string, withIntensity: (pill: string, label: string, n: number) => string, hideIntimate = false): string[] {
  const items: string[] = [];
  for (const p of d.pills) {
    if (hideIntimate && INTIMATE_PILLS.has(p)) continue;
    const base = label(p);
    items.push(PILLS.pain.includes(p) && d.painIntensity != null ? withIntensity(p, base, d.painIntensity) : base);
  }
  if (d.temperature != null) items.push(`${label('temperature')} ${formatNumber(d.temperature, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} °C`);
  if (d.note.trim()) items.push(label('note'));
  return items;
}
export function joinFr(items: string[], and = 'et'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

// ─── Calendrier ────────────────────────────────────────────────────────────────────────────────────

export interface CalendarCell {
  iso: string | null; day: number | null; today: boolean;
  period: 'logged' | 'predicted' | null; fertile: boolean; ovulation: boolean;
  symptoms: number; intimacy: boolean; contraception: boolean;
}
export interface CalendarData {
  periods: PeriodEntry[];
  symptomDays: Record<string, number>;
  intimacyDays: Set<string>;
  contraceptionDays: Set<string>;
}

/** Durée habituelle des règles (moyenne des règles terminées, 5 jours par défaut). */
export function usualPeriodLength(periods: PeriodEntry[]): number {
  const done = periods.filter((p) => p.end_date).map((p) => daysBetween(p.start_date, p.end_date!) + 1).filter((n) => n >= 1 && n <= 12);
  return done.length ? Math.round(done.reduce((a, b) => a + b, 0) / done.length) : 5;
}

/** Règles et fenêtres prévues sur les mois à venir (estimations, jamais des certitudes). */
export function projections(est: CycleEstimate, periods: PeriodEntry[], count = 6): { periods: { from: string; to: string }[]; fertile: { from: string; to: string; ovulation: string }[] } {
  if (!est.nextPeriod || !est.averageLength) return { periods: [], fertile: [] };
  const len = usualPeriodLength(periods);
  const out = { periods: [] as { from: string; to: string }[], fertile: [] as { from: string; to: string; ovulation: string }[] };
  // Fenêtre fertile du cycle en cours (avant les prochaines règles), puis des suivants
  for (let i = 0; i < count; i++) {
    const start = addDays(est.nextPeriod, i * est.averageLength);
    out.periods.push({ from: start, to: addDays(start, len - 1) });
    const ov = addDays(start, -14);
    out.fertile.push({ from: addDays(ov, -5), to: addDays(ov, 1), ovulation: ov });
  }
  return out;
}

export function calendarMonth(year: number, month0: number, data: CalendarData, est: CycleEstimate, todayIso: string, opts: { showIntimacy: boolean }): CalendarCell[] {
  const first = new Date(Date.UTC(year, month0, 1));
  const lead = (first.getUTCDay() + 6) % 7; // semaine commençant le lundi
  const days = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const proj = projections(est, data.periods);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < lead; i++) cells.push({ iso: null, day: null, today: false, period: null, fertile: false, ovulation: false, symptoms: 0, intimacy: false, contraception: false });
  for (let d = 1; d <= days; d++) {
    const iso = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const logged = data.periods.some((p) => p.start_date <= iso && iso <= (p.end_date ?? (daysBetween(p.start_date, todayIso) <= 9 && iso <= todayIso ? todayIso : p.start_date)));
    const predicted = !logged && iso > todayIso && proj.periods.some((x) => x.from <= iso && iso <= x.to);
    const fw = proj.fertile.find((x) => x.from <= iso && iso <= x.to) ?? (est.fertileWindow && est.fertileWindow.start <= iso && iso <= est.fertileWindow.end ? { ovulation: est.ovulation } : null);
    cells.push({
      iso, day: d, today: iso === todayIso, period: logged ? 'logged' : predicted ? 'predicted' : null,
      fertile: !logged && !!fw, ovulation: !logged && !!fw && fw.ovulation === iso,
      symptoms: Math.min(3, data.symptomDays[iso] ?? 0),
      intimacy: opts.showIntimacy && data.intimacyDays.has(iso), contraception: data.contraceptionDays.has(iso),
    });
  }
  while (cells.length % 7) cells.push({ iso: null, day: null, today: false, period: null, fertile: false, ovulation: false, symptoms: 0, intimacy: false, contraception: false });
  return cells;
}

/** Sélection de plusieurs jours → plages continues (pour enregistrer des règles en une fois). */
export function rangesOf(days: string[]): { from: string; to: string }[] {
  const sorted = [...new Set(days)].sort();
  const out: { from: string; to: string }[] = [];
  for (const d of sorted) {
    const last = out[out.length - 1];
    if (last && daysBetween(last.to, d) === 1) last.to = d; else out.push({ from: d, to: d });
  }
  return out;
}

/** Plan pour « ce sont mes règles » sur une sélection : fusionne avec des règles existantes qui se touchent. */
export function planPeriodSelection(days: string[], periods: (PeriodEntry & { id: string })[]): Op[] {
  const ops: Op[] = [];
  for (const r of rangesOf(days)) {
    const touching = periods.filter((p) => {
      const end = p.end_date ?? p.start_date;
      return !(daysBetween(end, r.from) > 1 || daysBetween(r.to, p.start_date) > 1);
    });
    if (touching.length) {
      const [keep, ...rest] = touching.sort((a, b) => a.start_date.localeCompare(b.start_date));
      const from = [r.from, ...touching.map((p) => p.start_date)].sort()[0];
      const to = [r.to, ...touching.map((p) => p.end_date ?? p.start_date)].sort().pop()!;
      ops.push({ table: 'period_entries', op: 'update', id: keep.id, values: { start_date: from, end_date: to } });
      for (const p of rest) ops.push({ table: 'period_entries', op: 'delete', id: p.id });
    } else {
      ops.push({ table: 'period_entries', op: 'insert', values: { start_date: r.from, end_date: r.to } });
    }
  }
  return ops;
}
