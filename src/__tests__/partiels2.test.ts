/**
 * Outils complétés le 30/11/2026 — règles pures et démonstration : 27 examens datés (fertilité), 129 journal du
 * langage, 132 jeux selon l'âge (catalogue 5 langues), 136 activités extrascolaires (créneaux, séances, rappels,
 * agenda), 137 devoirs (semaine, rappel de la veille), 175 intimité (« envie », sans pression), 177 baromètre du couple
 * (aucune comparaison, privé par défaut), 199 recommandations d'articles (moteur déterministe en lecture seule).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { DICTIONARIES } from '@/i18n/dictionaries';
import { APP_ROUTES } from '@/lib/routes.generated';
import { createDemoBackend } from '@/lib/backend/demo';
import { GAME_BANDS, GAME_IDS, GAMES, gameText } from '@/content/games';
import { GAMES_FR } from '@/content/games/fr';
import { alreadyNoted, counts, frise, homeLanguages, languageMilestones, type LanguageEntry } from '@/features/language/domain';
import { bandForMonths, durationOf, filterGames, nextMark } from '@/features/games/domain';
import { checkSlots, isoWeekday, nextSession, parseClock, reminderSchedules, sessionsBetween, validPhone } from '@/features/activities/domain';
import { eveReminderAt, knownSubjects, mondayOf, overdue, weekView, type Homework } from '@/features/homework/domain';
import { isLevel, LEVELS, myHistory, weekPair, type BarometerEntry } from '@/features/couple/barometer';
import { splitExams, type ExamRow } from '@/features/fertilityExams/domain';
import { recommendArticles } from '@/lib/domain/contentRecommendations';
import { itemsBetween, overlaps } from '@/lib/domain/calendar';
import { agendaItems, sortDay } from '@/lib/domain/myDay';
import { todayAgenda, activityForProfile } from '@/features/homeToday/todayModel';
import { recommend } from '@/lib/personalization';
import { SITUATIONS, offersRest } from '@/lib/domain/understand';
import { persona, NOW } from './fixtures/personas';
import type { ArticleSummary } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string };
const LANGS = ['fr', 'en', 'de', 'es', 'it'] as const;

describe('27 — examens datés du parcours fertilité', () => {
  const ex = (id: string, starts: string, track: string | null = 'fertility'): ExamRow => ({
    id, household_id: 'h', pregnancy_id: null, child_id: null, for_parent: true, kind: 'exam', title: id, starts_at: starts, location_label: null, notes: null, questions: [], care_track: track as 'fertility',
  });
  it('sépare à venir (ordre chronologique) et passés (récents d’abord), seulement le parcours fertilité', () => {
    const now = new Date('2026-11-20T10:00:00Z');
    const r = splitExams([ex('b', '2026-12-02T08:00:00Z'), ex('a', '2026-11-25T08:00:00Z'), ex('old', '2026-10-01T08:00:00Z'), ex('older', '2026-09-01T08:00:00Z'), ex('dentist', '2026-11-30T08:00:00Z', null)], now);
    expect(r.upcoming.map((x) => x.id)).toEqual(['a', 'b']);
    expect(r.past.map((x) => x.id)).toEqual(['old', 'older']);
  });
  it('aucun calendrier médical inventé : l’écran garde le guide et n’affiche que des dates saisies', () => {
    const src = fs.readFileSync('src/features/fertilityExams/ExamCalendar.tsx', 'utf8');
    expect(src).not.toMatch(/addDays|J\+|\bcycle day\b/);
    expect(fs.readFileSync('src/app/fertility/exams.tsx', 'utf8')).toMatch(/POSSIBLE_EXAMS/);
  });
});

describe('129 — journal du langage', () => {
  const e = (p: Partial<LanguageEntry>): LanguageEntry => ({ id: Math.random().toString(36).slice(2), household_id: 'h', child_id: 'c', kind: 'word', text: 'mama', language: null, said_on: null, note: null, ...p });
  it('frise par mois (récent d’abord), sans date à la fin, langues à part', () => {
    const g = frise([e({ text: 'mama', said_on: '2026-08-10' }), e({ kind: 'sentence', text: 'encore gâteau', said_on: '2026-11-02' }), e({ text: 'dodo', said_on: '2026-11-15' }),
      e({ kind: 'note', text: 'comprend « viens »' }), e({ kind: 'language', text: 'Arabe' })]);
    expect(g.map((x) => x.key)).toEqual(['2026-11', '2026-08', 'undated']);
    expect(g[0].entries.map((x) => x.text)).toEqual(['dodo', 'encore gâteau']);
    expect(g.flatMap((x) => x.entries).some((x) => x.kind === 'language')).toBe(false);
  });
  it('inventaire sans total ni score, langues sans doublon, mot déjà noté signalé', () => {
    const list = [e({ text: 'mama' }), e({ kind: 'language', text: 'Arabe' }), e({ kind: 'language', text: 'arabe ' }), e({ kind: 'sentence', text: 'à table' })];
    expect(counts(list)).toEqual({ word: 1, sentence: 1, language: 2, note: 0 });
    expect(homeLanguages(list).map((x) => x.text)).toEqual(['Arabe']);
    expect(alreadyNoted(list, 'word', ' MAMA')).toBe(true);
    expect(alreadyNoted(list, 'word', 'mama', list[0].id)).toBe(false);
  });
  it('repères indicatifs : les étapes « langage » existantes, chacune avec sa source ; aucun mot de retard', () => {
    const m = languageMilestones();
    expect(m.length).toBeGreaterThanOrEqual(5);
    expect(m.every((s) => s.category === 'language' && !!s.source)).toBe(true);
    for (const l of LANGS) {
      const note = String(DICTIONARIES[l]['p2.lg.refsNote']);
      expect(note.length).toBeGreaterThan(80);
      expect(note.toLowerCase()).not.toMatch(/retard|delay|verzögerung|retraso|ritardo|anormal|abnormal/);
    }
  });
});

describe('132 — jeux selon l’âge', () => {
  it('au moins 30 jeux, 8 par tranche (0–1, 1–3, 3–6, 6–10 ans), textes complets dans les 5 langues', () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAME_IDS.length);
    for (const b of GAME_BANDS) expect(GAMES.filter((g) => g.band === b).length).toBeGreaterThanOrEqual(7);
    for (const l of LANGS) for (const id of GAME_IDS) {
      const t = gameText(id, l);
      expect(t.title.length).toBeGreaterThan(3);
      expect(t.how.length).toBeGreaterThan(40);
      expect(t.material.length).toBeGreaterThan(2);
      expect(!!t.safety).toBe(!!GAMES_FR[id].safety); // le rappel de sécurité n'est jamais perdu en traduction
    }
  });
  it('les jeux avec de petits objets, de l’eau ou un four ont un rappel de sécurité', () => {
    for (const id of ['boite_tresors', 'transvaser', 'bateau_papier', 'cuisiner', 'coule_flotte', 'bulles', 'pate_a_sel'] as const) expect(GAMES_FR[id].safety).toBeTruthy();
  });
  it('tranche d’âge, durée et lieu filtrent ; favoris seulement ; « on l’a fait » sans série', () => {
    expect([0, 11, 12, 35, 36, 71, 72, 140].map(bandForMonths)).toEqual(['0_1', '0_1', '1_3', '1_3', '3_6', '3_6', '6_10', '6_10']);
    expect([5, 10, 15, 20, 30].map(durationOf)).toEqual(['short', 'short', 'medium', 'medium', 'long']);
    const out = filterGames({ band: '6_10', duration: null, place: 'out' });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((g) => g.band === '6_10' && g.place !== 'in')).toBe(true);
    const fav = filterGames({ band: null, duration: null, place: null, favoritesOnly: true }, [{ game_key: 'marelle', favorite: true }, { game_key: 'ombres', favorite: false }]);
    expect(fav.map((g) => g.id)).toEqual(['marelle']);
    expect(nextMark(undefined, 'done', '2026-11-20')).toEqual({ favorite: false, done_count: 1, last_done_on: '2026-11-20' });
    expect(nextMark({ favorite: true, done_count: 2, last_done_on: '2026-11-01' }, 'favorite', '2026-11-20')).toEqual({ favorite: false, done_count: 2, last_done_on: '2026-11-01' });
  });
});

describe('136 — activités extrascolaires', () => {
  const judo = { id: 'j', child_id: 'noe', slots: [{ day: 3 as const, from: '14:00', to: '15:00' }, { day: 6 as const, from: '10:00', to: '11:00' }], starts_on: null, ends_on: null };
  it('heures saisies librement, créneaux vérifiés (au moins un, fin après début, pas de chevauchement)', () => {
    expect(['14h', '14h30', '9:05', '1730', '25h', 'abc'].map(parseClock)).toEqual(['14:00', '14:30', '09:05', '17:30', null, null]);
    expect(checkSlots([])).toBe('none');
    expect(checkSlots([{ day: 2, from: '15:00', to: '14:00' }])).toBe('order');
    expect(checkSlots([{ day: 2, from: '14:00', to: '15:00' }, { day: 2, from: '14:30', to: '16:00' }])).toBe('overlap');
    expect(checkSlots(judo.slots)).toBeNull();
    expect(validPhone('06 12 34 56 78')).toBe(true);
    expect(validPhone('appelle-moi')).toBe(false);
  });
  it('séances dépliées sur la période (mercredi et samedi), bornes de saison respectées, prochaine séance', () => {
    expect(isoWeekday('2026-11-18')).toBe(3);
    const s = sessionsBetween(judo, new Date(2026, 10, 16), new Date(2026, 10, 23));
    expect(s.map((x) => x.day)).toEqual(['2026-11-18', '2026-11-21']);
    expect(new Date(s[0].starts).getHours()).toBe(14);
    expect(sessionsBetween({ ...judo, ends_on: '2026-11-19' }, new Date(2026, 10, 16), new Date(2026, 10, 23)).length).toBe(1);
    expect(nextSession(judo, new Date(2026, 10, 18, 14, 30))!.day).toBe('2026-11-21');
  });
  it('rappels hebdomadaires regroupés par heure, la veille si le rappel tombe avant minuit', () => {
    expect(reminderSchedules(judo.slots, 60)).toEqual([{ weekdays: [6], hour: 9, minute: 0 }, { weekdays: [3], hour: 13, minute: 0 }]);
    expect(reminderSchedules([{ day: 1, from: '00:30', to: '01:30' }], 60)).toEqual([{ weekdays: [7], hour: 23, minute: 30 }]);
    expect(reminderSchedules([{ day: 2, from: '17:00', to: '18:00' }, { day: 4, from: '17:00', to: '18:00' }], 30)).toEqual([{ weekdays: [2, 4], hour: 16, minute: 30 }]);
  });
  it('agenda familial, journée de l’accueil et « Ma journée » : les séances apparaissent, avec l’enfant', () => {
    const sess = sessionsBetween(judo, new Date(2026, 10, 18), new Date(2026, 10, 19)).map((x) => ({ id: `j:${x.starts}`, activityId: 'j', childId: 'noe', title: 'Judo', starts: x.starts, ends: x.ends, location: 'Dojo' }));
    const items = itemsBetween({ activities: sess }, new Date(2026, 10, 18), new Date(2026, 10, 19));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ source: 'activity', refId: 'j', childId: 'noe', title: 'Judo', location: 'Dojo' });
    const appt = { id: 'a', title: 'Pédiatre', starts_at: items[0].starts, location_label: null, kind: 'pediatric' };
    expect(overlaps(itemsBetween({ activities: sess, appointments: [appt] }, new Date(2026, 10, 18), new Date(2026, 10, 19))).size).toBe(2);
    expect(todayAgenda({ activities: sess }, new Date(2026, 10, 18, 9)).map((i) => i.source)).toEqual(['activity']);
    expect(activityForProfile({ childId: 'noe' }, { kind: 'child', childId: 'noe' })).toBe(true);
    expect(activityForProfile({ childId: 'noe' }, { kind: 'child', childId: 'lina' })).toBe(false);
    const day = sortDay(agendaItems(items, '2026-11-18'));
    expect(day[0]).toMatchObject({ kind: 'activity', link: '/child/noe/activities?a=j', time: '14:00' });
  });
});

describe('137 — devoirs', () => {
  const hw = (p: Partial<Homework>): Homework => ({ id: Math.random().toString(36).slice(2), household_id: 'h', child_id: 'noe', subject: 'Lecture', instructions: 'p. 12', due_on: '2026-11-20', done_at: null, done_by: null, remind_eve: true, ...p });
  it('semaine du lundi au dimanche, à faire avant fait', () => {
    expect(mondayOf('2026-11-22')).toBe('2026-11-16');
    const w = weekView([hw({ subject: 'Maths', due_on: '2026-11-18', done_at: 'x' }), hw({ subject: 'Lecture', due_on: '2026-11-18' }), hw({ due_on: '2026-11-30' })], '2026-11-20');
    expect(w.map((d) => d.date)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
    expect(w[2].items.map((h) => h.subject)).toEqual(['Lecture', 'Maths']);
    expect(w.flatMap((d) => d.items)).toHaveLength(2);
  });
  it('encore à faire (échéance passée, non fait) ; rappel la veille à 18 h, jamais dans le passé', () => {
    expect(overdue([hw({ due_on: '2026-11-18' }), hw({ due_on: '2026-11-18', done_at: 'x' }), hw({ due_on: '2026-11-21' })], '2026-11-20')).toHaveLength(1);
    const at = eveReminderAt('2026-11-25', new Date(2026, 10, 20, 9));
    expect(new Date(at!).getDate()).toBe(24);
    expect(new Date(at!).getHours()).toBe(18);
    expect(eveReminderAt('2026-11-20', new Date(2026, 10, 20, 9))).toBeNull();
    expect(knownSubjects([hw({ subject: 'Maths' }), hw({ subject: 'maths ' }), hw({ subject: 'Lecture' })])).toEqual(['Maths', 'Lecture']);
  });
});

describe('175 — intimité sans pression (« Se comprendre »)', () => {
  it('une situation « envie » écrite à l’avance dans les 5 langues, sans proposition de repos automatique', () => {
    expect(SITUATIONS).toContain('desire');
    expect(offersRest({ situation: 'desire' })).toBe(false);
    for (const l of LANGS) {
      const base = String(DICTIONARIES[l]['und.t.desire.base']);
      expect(base.length).toBeGreaterThan(60);
      expect(String(DICTIONARIES[l]['und.t.desire.short']).length).toBeLessThan(base.length);
    }
    expect(String(DICTIONARIES.fr['und.t.desire.base'])).toMatch(/pas une demande/);
  });
  it('la base de données accepte « desire » (migration 20261130100500)', () => {
    expect(fs.readFileSync('supabase/migrations/20261130100500_intimite_desir.sql', 'utf8')).toMatch(/'no_sex_now', 'desire'/);
  });
});

describe('177 — baromètre du couple', () => {
  const b = (p: Partial<BarometerEntry>): BarometerEntry => ({ id: Math.random().toString(36).slice(2), household_id: 'h', user_id: 'me', week_of: '2026-11-16', level: 3, word: null, shared: false, ...p });
  it('ma jauge de la semaine et seulement ce que l’autre a partagé ; mon historique à moi', () => {
    const rows = [b({ id: 'm', level: 4 }), b({ id: 'p1', user_id: 'other', level: 2, shared: false }), b({ id: 'old', week_of: '2026-11-09', level: 5 }), b({ id: 'p2', user_id: 'other', week_of: '2026-11-16', shared: true })];
    const w = weekPair(rows, 'me', '2026-11-16');
    expect(w.mine?.id).toBe('m');
    expect(w.shared.map((x) => x.id)).toEqual(['p2']);
    expect(myHistory(rows, 'me', '2026-11-16').map((x) => x.id)).toEqual(['old']);
    expect(LEVELS.every(isLevel)).toBe(true);
  });
  it('aucune comparaison, aucun score : ni dans le code, ni dans les textes (5 langues)', () => {
    const src = fs.readFileSync('src/features/couple/BarometerCard.tsx', 'utf8') + fs.readFileSync('src/features/couple/barometer.ts', 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/average|moyenne|Math\.abs|diff\(|score/i);
    for (const l of LANGS) {
      const texts = Object.entries(DICTIONARIES[l]).filter(([k]) => k.startsWith('p2.bm.')).map(([, v]) => String(v).toLowerCase()).join(' ');
      expect(texts).not.toMatch(/\bscore\b|moyenne|average|durchschnitt|promedio|media del|\bnote de\b|compar[ea] (vos|your)/);
      expect(String(DICTIONARIES[l]['p2.bm.shareD']).length).toBeGreaterThan(20);
    }
  });
  it('démonstration : la jauge privée de l’autre reste invisible, la partagée apparaît', async () => {
    const be = createDemoBackend({ strictPremium: false });
    await be.auth.signUp('bm@exemple.test', 'MotDePasse!2026');
    await be.auth.signIn('bm@exemple.test', 'MotDePasse!2026');
    const me = (await be.auth.getSession())!.userId;
    const { household_id: hid } = await be.rpc<{ household_id: string }>('ensure_my_account');
    const { user_id: partner } = await be.rpc<{ user_id: string }>('demo_mission_partner');
    await be.insert('couple_barometer', { household_id: hid, user_id: me, week_of: '2026-11-16', level: 4, shared: false });
    await be.rpc('demo_switch_person', { p_user: partner });
    expect(await be.select({ table: 'couple_barometer', filters: [{ col: 'household_id', op: 'eq', value: hid }] })).toEqual([]);
    await be.insert('couple_barometer', { household_id: hid, user_id: partner, week_of: '2026-11-16', level: 2, shared: true });
    await be.rpc('demo_switch_person', { p_user: me });
    const seen = await be.select<{ user_id: string }>({ table: 'couple_barometer', filters: [{ col: 'household_id', op: 'eq', value: hid }] });
    expect(seen.map((r) => r.user_id).sort()).toEqual([me, partner].sort());
  });
});

describe('199 — recommandations d’articles personnalisées', () => {
  const art = (slug: string, title: string, p: Partial<ArticleSummary> = {}) => ({
    id: slug, slug, title, summary: 's', tags: [], journeys: [], category_id: null, is_premium: false, is_safety_critical: false, updated_on: '2026-11-01',
    min_week: null, max_week: null, min_age_months: null, max_age_months: null, postpartum: false, editorial_status: 'reviewed', ...p,
  }) as unknown as ArticleSummary;
  const articles = [
    art('sommeil-bebe', 'Le sommeil de bébé : les nuits', { journeys: ['newborn'] }), art('allaitement-debut', 'Allaitement : bien démarrer les tétées', { journeys: ['newborn'] }),
    art('biberon-preparer', 'Préparer un biberon', { journeys: ['newborn'] }), art('jeux-3-6', 'Jeux de société 3-6 ans', { journeys: ['child'] }),
    art('rentree', 'Rentrée scolaire : préparer le cartable', { journeys: ['child'] }), art('grossesse-24', 'Grossesse : le 6e mois', { journeys: ['pregnant'] }),
  ];
  it('chaque article vient d’un outil recommandé par le moteur (lecture seule) et garde sa raison ; aucun favori reproposé', () => {
    const f = persona('B').facts;
    const recs = recommend(f, {}, { max: 12 });
    const picks = recommendArticles({ recommendations: recs, articles, ctx: { journeys: ['newborn'] }, n: 4 });
    expect(picks.length).toBeGreaterThan(0);
    expect(new Set(picks.map((p) => p.article.id)).size).toBe(picks.length);
    const withReason = picks.filter((p) => p.reason);
    expect(withReason.length).toBeGreaterThan(0);
    for (const p of withReason) expect(recs.some((r) => r.id === p.toolId && r.reason === p.reason)).toBe(true);
    const again = recommendArticles({ recommendations: recs, articles, ctx: { journeys: ['newborn'] }, exclude: picks.map((p) => p.article.id), n: 4 });
    expect(again.some((p) => picks.some((q) => q.article.id === p.article.id))).toBe(false);
  });
  it('profil différent, articles différents ; jamais d’article d’un autre moment de vie en tête', () => {
    const forBaby = recommendArticles({ recommendations: recommend(persona('B').facts), articles, ctx: { journeys: ['newborn'] }, n: 3 }).map((p) => p.article.id);
    const forKid = recommendArticles({ recommendations: recommend(persona('D').facts), articles, ctx: { journeys: ['child'] }, n: 3 }).map((p) => p.article.id);
    expect(forBaby).not.toEqual(forKid);
    expect(forKid).not.toContain('grossesse-24');
    expect(NOW.getFullYear()).toBe(2026);
  });
});

describe('routes et traductions', () => {
  it('les vues existent', () => {
    for (const r of ['/child/[id]/language', '/child/[id]/games', '/child/[id]/activities', '/child/[id]/homework', '/fertility/exams', '/family/couple', '/family/understand', '/library']) {
      expect(APP_ROUTES as readonly string[]).toContain(r);
    }
  });
  it('mêmes clés p2.* dans les 5 langues, aucune vide', () => {
    const keys = Object.keys(DICTIONARIES.fr).filter((k) => k.startsWith('p2.'));
    expect(keys.length).toBeGreaterThan(150);
    for (const l of LANGS) for (const k of keys) expect(String(JSON.stringify(DICTIONARIES[l][k] ?? '')).length).toBeGreaterThan(2);
  });
});
