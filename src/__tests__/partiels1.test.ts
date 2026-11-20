/**
 * Numéros partiels complétés (29/11/2026) — logique pure et règles de la démonstration :
 * 42 analyses · 50 souvenirs de grossesse · 51/57 rendez-vous et questions postnatales · 53 récupération physique ·
 * 72 lots de lait tiré · 75/83/84 journal alimentaire · 80 relais de biberons · 120/123 DME et refus.
 * Vérifie aussi : aucune norme ni interprétation dans les textes affichés, cinq langues complètes.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string };
const read = (rel: string) => fs.readFileSync(`${process.cwd()}/${rel}`, 'utf8');
import { setLocale, t as tr, type TKey } from '@/i18n';
import { APP_ROUTES } from '@/lib/routes.generated';
import { analysisKey, curvePoints, formatLabValue, groupByAnalysis, knownNames, parseLabValue, validateLab, type LabResult } from '@/features/labs/domain';
import { byTrimester, parseWeek, validateMemory, weekOn, type PregnancyMemory } from '@/features/pregnancyMemories/domain';
import { buildEntries, hourBands, journalCsv, journalPdfSections, split, sumTotals, totalsOf, weekTotals, type JournalLabels } from '@/features/feeding/journal';
import { matchingBottle, nightPersonAt, planRelays, relayView, sortRelays, validateRelay, type BottleRelay } from '@/features/feeding/relays';
import { lotsOf, pumpingRemaining, splitAmount, unstoredPumpings, validateSplit, type MilkItem } from '@/features/feeding/milkStock';
import { refusals, statusFromOutcome, type Tasting } from '@/lib/domain/discoveries';
import { bodyHistory, postnatalTimeline, questionsToCopy } from '@/features/postpartumCare/domain';
import { lactationSuggestions } from '@/features/feeding/issues';
import { createAbsents, PERSONAL_TABLES } from '@/lib/backend/demoAbsents';

const LANGS = ['fr', 'en', 'de', 'es', 'it'] as const;
beforeAll(() => setLocale('fr'));
afterAll(() => setLocale('fr'));
const iso = (d: string, h = 10, m = 0) => new Date(`${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).toISOString();

describe('42 analyses : valeurs saisies, jamais interprétées', () => {
  const lab = (o: Partial<LabResult>): LabResult => ({ id: Math.random().toString(36).slice(2), user_id: 'u', pregnancy_id: null, document_id: null, name: 'Hémoglobine', value: 12, unit: 'g/dL', measured_on: '2026-10-01', lab_reference: '11,5 – 16', note: null, ...o });
  it('valeur : virgule ou point, 4 décimales au plus, rien d’autre', () => {
    expect(parseLabValue('12,4')).toBe(12.4);
    expect(parseLabValue(' 12.4 ')).toBe(12.4);
    expect(parseLabValue('-3')).toBe(-3);
    expect(parseLabValue('1,23456')).toBeNull();
    expect(parseLabValue('< 5')).toBeNull();
    expect(parseLabValue('12 g/dL')).toBeNull();
    expect(formatLabValue(12.4)).toBe('12,4');
    expect(formatLabValue(12.4, false)).toBe('12.4');
  });
  it('regroupement par analyse (casse, accents, espaces), courbe dans une seule unité', () => {
    const list = [lab({ measured_on: '2026-09-01', value: 12.6 }), lab({ name: ' hemoglobine ', measured_on: '2026-11-01', value: 11.9 }), lab({ name: 'HÉMOGLOBINE', measured_on: '2026-10-01', unit: 'mmol/L', value: 7.4 }),
      lab({ name: 'Ferritine', unit: 'µg/L', value: 24, measured_on: '2026-10-20' })];
    expect(analysisKey('  Hémoglobine ')).toBe(analysisKey('hemoglobine'));
    const g = groupByAnalysis(list);
    expect(g.map((x) => x.name)).toEqual(['hemoglobine', 'Ferritine']);
    expect(g[0].entries.map((e) => e.measured_on)).toEqual(['2026-09-01', '2026-10-01', '2026-11-01']);
    expect(g[0].unit).toBe('g/dL');
    expect(g[0].otherUnits).toBe(1);
    expect(curvePoints(g[0]).map((p) => p.y)).toEqual([12.6, 11.9]);
    expect(knownNames(list)).toHaveLength(2);
  });
  it('validation : nom, valeur, date, jamais dans le futur', () => {
    const ok = { name: 'TSH', value: 1.2, date: '2026-11-01', unit: 'mUI/L', reference: '0,4 – 4' };
    expect(validateLab(ok, '2026-11-20')).toBeNull();
    expect(validateLab({ ...ok, name: ' ' }, '2026-11-20')).toBe('lab.err.name');
    expect(validateLab({ ...ok, value: null }, '2026-11-20')).toBe('lab.err.value');
    expect(validateLab({ ...ok, date: '2026-12-01' }, '2026-11-20')).toBe('lab.err.future');
    expect(validateLab({ ...ok, reference: 'x'.repeat(81) }, '2026-11-20')).toBe('lab.err.reference');
  });
  it('aucun mot d’interprétation dans le module ni dans les textes', () => {
    const src = read('src/features/labs/domain.ts') + read('src/app/documents/labs.tsx');
    expect(src).not.toMatch(/\b(isNormal|isLow|isHigh|outOfRange|abnormal)\b/i);
    for (const l of LANGS) {
      setLocale(l);
      for (const k of ['lab.intro', 'lab.last', 'lab.previous', 'lab.refLine', 'lab.noAdvice'] as TKey[]) {
        expect(tr(k, { value: '1', date: 'x', ref: 'r' })).not.toMatch(/\b(normal|anormal|bas|élevé|low|high|abnormal|niedrig|hoch|bajo|alto|basso)\b/i);
      }
    }
    setLocale('fr');
  });
});

describe('50 souvenirs de grossesse', () => {
  it('semaine d’aménorrhée d’après le terme (41 SA à terme), hors grossesse : rien', () => {
    expect(weekOn('2027-03-01', '2027-03-01')).toBe(41);
    expect(weekOn('2027-03-01', '2027-02-08')).toBe(38);
    expect(weekOn('2027-03-01', '2026-05-01')).toBeNull();
    expect(weekOn(null, '2026-11-01')).toBeNull();
  });
  it('saisie : date, futur, semaine, vide, 6 photos au plus', () => {
    const ok = { date: '2026-11-01', week: 22, title: 'Écho', body: '', photos: [] };
    expect(validateMemory(ok, '2026-11-20')).toBeNull();
    expect(validateMemory({ ...ok, date: '2026-12-01' }, '2026-11-20')).toBe('pmem.err.future');
    expect(validateMemory({ ...ok, title: '' }, '2026-11-20')).toBe('pmem.err.empty');
    expect(validateMemory({ ...ok, title: '', photos: ['p'] }, '2026-11-20')).toBeNull();
    expect(validateMemory({ ...ok, week: 50 }, '2026-11-20')).toBe('pmem.err.week');
    expect(validateMemory({ ...ok, photos: ['1', '2', '3', '4', '5', '6', '7'] }, '2026-11-20')).toBe('pmem.err.photos');
    expect(parseWeek('22 SA')).toBe(22);
    expect(parseWeek('')).toBeNull();
    expect(Number.isNaN(parseWeek('vingt'))).toBe(true);
  });
  it('par trimestre, du plus récent au plus ancien', () => {
    const m = (id: string, d: string, w: number | null): PregnancyMemory => ({ id, user_id: 'u', pregnancy_id: null, happened_on: d, week_sa: w, kind: 'moment', title: id, body: null, photo_ids: [] });
    const g = byTrimester([m('a', '2026-05-01', 10), m('b', '2026-08-01', 24), m('c', '2026-09-01', 30), m('d', '2026-08-10', 25)]);
    expect(g.map((x) => [x.trimester, x.items.map((i) => i.id)])).toEqual([[3, ['c']], [2, ['d', 'b']], [1, ['a']]]);
  });
});

describe('51 / 57 rendez-vous postnataux saisis, questions postnatales', () => {
  const a = (id: string, kind: string, at: string, questions: string[] = []) => ({ id, kind, title: id, starts_at: at, questions });
  it('seulement les rendez-vous saisis (postnatal, rééducation), situés après la naissance', () => {
    const now = new Date('2026-11-20T09:00:00Z');
    const t = postnatalTimeline([a('p1', 'postnatal', '2026-12-01T09:00:00Z'), a('r1', 'perineal_rehab', '2026-11-10T09:00:00Z'), a('x', 'pediatric', '2026-11-25T09:00:00Z')], '2026-10-20', now);
    expect(t.upcoming.map((x) => [x.appt.id, x.weeksAfterBirth])).toEqual([['p1', 6]]);
    expect(t.past.map((x) => [x.appt.id, x.weeksAfterBirth])).toEqual([['r1', 3]]);
    expect(postnatalTimeline([a('p', 'postnatal', '2026-12-01T09:00:00Z')], null, now).upcoming[0].weeksAfterBirth).toBeNull();
  });
  it('copie dans le rendez-vous : questions non posées, sans doublon', () => {
    expect(questionsToCopy([{ question: 'Quand reprendre le sport ?', done: false }, { question: 'Déjà posée', done: true }, { question: 'Contraception', done: false }], ['quand reprendre le sport'])).toEqual(['Contraception']);
  });
  it('liste « lactation » : questions ouvertes, sans diagnostic', () => {
    expect(lactationSuggestions()).toHaveLength(5);
    expect(new Set(lactationSuggestions()).size).toBe(5);
  });
});

describe('53 récupération physique (point du jour)', () => {
  it('historique : seulement les jours où cicatrice, périnée ou saignements ont été notés', () => {
    const h = bodyHistory([{ checkin_date: '2026-11-18', scar_feeling: 'better' }, { checkin_date: '2026-11-19' }, { checkin_date: '2026-11-20', bleeding: 'light', perineum_feeling: 'same' }]);
    expect(h).toEqual([{ day: '2026-11-20', scar: null, perineum: 'same', bleeding: 'light' }, { day: '2026-11-18', scar: 'better', perineum: null, bleeding: null }]);
  });
  it('le point du jour relie la cicatrisation (60) et la rééducation (58) existantes', () => {
    const src = read('src/features/postpartumCare/BodyFields.tsx');
    expect(src).toMatch(/\/postpartum\/healing/);
    expect(src).toMatch(/\/postpartum\/pelvic/);
  });
});

describe('72 lait tiré : lots et contenants', () => {
  const item = (o: Partial<MilkItem>): MilkItem => ({ id: 'm', household_id: 'h', child_id: null, pumping_id: null, expressed_at: iso('2026-11-20'), amount_ml: 100, location: 'fridge', thawed_at: null,
    use_by: iso('2026-11-22'), status: 'stored', closed_at: null, note: null, created_by: null, created_at: iso('2026-11-20'), updated_at: iso('2026-11-20'), ...o });
  it('partage en contenants entiers, total conservé', () => {
    expect(splitAmount(200, 3)).toEqual([67, 67, 66]);
    expect(splitAmount(120, 2)).toEqual([60, 60]);
    expect(splitAmount(2, 3)).toEqual([]);
  });
  it('reste à ranger, lot, contrôle du total', () => {
    const stock = [item({ id: 'a', pumping_id: 'p', amount_ml: 120 }), item({ id: 'b', pumping_id: 'p', amount_ml: 50, status: 'used' }), item({ id: 'c' })];
    expect(pumpingRemaining({ id: 'p', amount_ml: 200 }, stock)).toBe(30);
    expect(pumpingRemaining({ id: 'p', amount_ml: 200 }, stock, 'a')).toBe(150);
    expect(lotsOf(stock)).toEqual([{ pumping_id: 'p', items: [stock[0], stock[1]], ml: 170 }]);
    expect(validateSplit([60, 60], 120)).toBeNull();
    expect(validateSplit([60, 61], 120)).toBe('milk.err.split');
    expect(validateSplit([0, 60], 120)).toBe('milk.err.amount');
    // une séance déjà rangée (même en partie) n'est plus proposée dans « à ranger » (reste proposé à part)
    expect(unstoredPumpings([{ id: 'p', amount_ml: 200, at: iso('2026-11-20') }], stock, 72, new Date(iso('2026-11-20', 12)))).toEqual([]);
  });
});

describe('75 / 83 / 84 journal alimentaire : tétées + biberons + repas, factuel', () => {
  const bf = [
    { id: 'b1', started_at: iso('2026-11-20', 7), ended_at: iso('2026-11-20', 7, 15), side: 'left' as const },
    { id: 'b2', started_at: iso('2026-11-20', 13), ended_at: null, side: 'right' as const, _pending: true },
    { id: 'b3', started_at: iso('2026-11-19', 22), ended_at: iso('2026-11-19', 22, 10), side: 'both' as const },
  ];
  const bo = [
    { id: 'o1', at: iso('2026-11-20', 10), prepared_ml: 150, consumed_ml: 120, milk_type: 'Lait 2e âge', created_by: 'u' },
    { id: 'o2', at: iso('2026-11-20', 19), prepared_ml: 150, consumed_ml: null, milk_type: null },
  ];
  const me = [{ id: 'm1', at: iso('2026-11-20', 12), foods: ['Carotte', 'Courgette'], refused_foods: ['Courgette'], description: null, reaction_note: null }];
  const entries = buildEntries(bf, bo, me);
  it('un seul journal, du plus récent au plus ancien ; en attente signalé', () => {
    expect(entries.map((e) => e.id)).toEqual(['o2', 'b2', 'm1', 'o1', 'b1', 'b3']);
    expect(entries.find((e) => e.id === 'b2')!.pending).toBe(true);
    expect(entries.find((e) => e.id === 'o1')!.ml).toBe(120);
    expect(entries.find((e) => e.id === 'o2')!.mlKind).toBe('prepared');
  });
  it('totaux du jour, répartition des prises notées (entiers, total 100)', () => {
    const t = totalsOf(entries, '2026-11-20');
    expect(t.breast).toEqual({ count: 2, minutes: 15, withDuration: 1, left: 1, right: 1, both: 0 });
    expect(t.bottle).toEqual({ count: 2, ml: 270, withQty: 2 });
    expect(t.meal).toEqual({ count: 1, refused: 1 });
    expect(split([t])).toEqual({ breast: 50, bottle: 50, breastCount: 2, bottleCount: 2 });
    const w = weekTotals(entries, ['2026-11-20', '2026-11-19', '2026-11-18']);
    expect(split(w)).toEqual({ breast: 60, bottle: 40, breastCount: 3, bottleCount: 2 });
    expect(sumTotals(w).feeds).toBe(5);
    expect(split([totalsOf(entries, '2026-11-01')])).toBeNull();
    expect(hourBands(entries).reduce((a, b) => a + b, 0)).toBe(5);
  });
  it('CSV : BOM, « ; », une ligne par saisie, formules neutralisées', () => {
    const l: JournalLabels = { date: 'Date', time: 'Heure', type: 'Type', duration: 'Durée', side: 'Côté', quantity: 'Quantité', milk: 'Lait', foods: 'Aliments', refused: 'Refusés', note: 'Note', by: 'Par', prepared: 'préparés',
      kinds: { breast: 'Tétée', bottle: 'Biberon', meal: 'Repas' }, sides: { left: 'gauche', right: 'droit', both: 'les deux' }, nameOf: () => 'Camille' };
    const csv = journalCsv([...entries, { ...entries[0], id: 'x', note: '=SUM(A1)' }], l);
    expect(csv.startsWith('﻿"Date";"Heure"')).toBe(true);
    expect(csv.trim().split('\r\n')).toHaveLength(8);
    expect(csv).toContain('"Courgette"');
    expect(csv).toContain('"150 (préparés)"');
    expect(csv).toContain(`"'=SUM(A1)"`);
  });
  it('PDF : un paragraphe par jour, du plus ancien au plus récent', () => {
    const s = journalPdfSections(entries, ['2026-11-20', '2026-11-19'], { dayTitle: (d) => d, totals: (t) => `T${t.feeds}`, line: (e) => e.id, empty: 'vide' });
    expect(s.map((x) => x.heading)).toEqual(['2026-11-19', '2026-11-20']);
    expect(s[1].lines).toEqual(['T4', 'b1', 'o1', 'm1', 'b2', 'o2']);
  });
  it('aucune norme ni « bonne quantité » dans les textes, dans les 5 langues', () => {
    for (const l of LANGS) {
      setLocale(l);
      for (const k of ['fj.intro', 'fj.splitLine', 'fj.hoursNote', 'fj.noNorm', 'fj.export.notice'] as TKey[]) {
        expect(tr(k, { name: 'Lina', breast: 50, bottle: 50, nb: 2, nbo: 2 })).not.toMatch(/\b(recommandé|insuffisant|trop peu|recommended|not enough|empfohlen|recomendad|raccomandat)/i);
      }
    }
    setLocale('fr');
  });
});

describe('80 relais de biberons', () => {
  const shifts = [{ user_id: 'sam', starts_at: iso('2026-11-20', 22), ends_at: iso('2026-11-21', 6), status: 'planned', kind: 'night' }, { user_id: 'cam', starts_at: iso('2026-11-21', 22), ends_at: iso('2026-11-22', 6), status: 'cancelled', kind: 'night' }];
  it('personne proposée : celle du relais de nuit (relais annulé ignoré)', () => {
    expect(nightPersonAt(iso('2026-11-21', 2), shifts)).toBe('sam');
    expect(nightPersonAt(iso('2026-11-22', 2), shifts)).toBeNull();
  });
  it('plan : relais de nuit d’abord, sinon alternance', () => {
    const p = planRelays({ start: iso('2026-11-20', 16), everyMinutes: 180, count: 4, people: ['cam', 'sam'], first: 'cam', shifts, alternate: true });
    expect(p.map((x) => x.assigned_to)).toEqual(['cam', 'sam', 'sam', 'sam']); // 22 h et 1 h : relais de nuit de Sam
    expect(Date.parse(p[3].planned_at) - Date.parse(p[0].planned_at)).toBe(9 * 3600_000);
    const fixed = planRelays({ start: iso('2026-11-20', 12), everyMinutes: 120, count: 3, people: ['cam', 'sam'], first: 'cam', shifts, alternate: false });
    expect(fixed.map((x) => x.assigned_to)).toEqual(['cam', 'cam', 'cam']);
  });
  it('état, biberon noté à côté (jamais déjà relié), ordre', () => {
    const r = (id: string, at: string, status: BottleRelay['status'] = 'planned', bottle_id: string | null = null): BottleRelay => ({ id, household_id: 'h', child_id: 'k', planned_at: at, planned_ml: 150, assigned_to: 'sam', status, bottle_id, given_at: status === 'given' ? at : null, note: null });
    const now = new Date(iso('2026-11-21', 2));
    expect(relayView(r('a', iso('2026-11-21', 3)), now)).toBe('upcoming');
    expect(relayView(r('a', iso('2026-11-21', 2, 20)), now)).toBe('now');
    expect(relayView(r('a', iso('2026-11-20', 23)), now)).toBe('past');
    expect(relayView(r('a', iso('2026-11-20', 23), 'given'), now)).toBe('given');
    const bottles = [{ id: 'x', at: iso('2026-11-21', 2, 10) }, { id: 'y', at: iso('2026-11-21', 9) }];
    expect(matchingBottle(r('a', iso('2026-11-21', 2)), bottles, [])?.id).toBe('x');
    expect(matchingBottle(r('a', iso('2026-11-21', 2)), bottles, [r('b', iso('2026-11-20', 2), 'given', 'x')])).toBeNull();
    const s = sortRelays([r('1', iso('2026-11-21', 5)), r('2', iso('2026-11-21', 1)), r('3', iso('2026-11-20', 1), 'skipped')]);
    expect(s.open.map((x) => x.id)).toEqual(['2', '1']);
    expect(s.done.map((x) => x.id)).toEqual(['3']);
    expect(validateRelay({ at: iso('2026-11-21', 1), ml: '', person: 'sam' })).toBeNull();
    expect(validateRelay({ at: iso('2026-11-21', 1), ml: '900', person: 'sam' })).toBe('brl.err.ml');
    expect(validateRelay({ at: null, ml: '', person: 'sam' })).toBe('brl.err.time');
  });
});

describe('120 / 123 DME et refus, sans jugement', () => {
  const t = (food: string, d: string, status: Tasting['status']): Tasting => ({ id: `${food}${d}`, child_id: 'k', food_key: food, food_name: food, tasted_on: d, status, reaction: false, reaction_note: null, texture: null, preparation: null, note: null });
  it('issue → statut : un refus reste un refus', () => {
    expect(statusFromOutcome('refused', 'liked')).toBe('refused');
    expect(statusFromOutcome('ate', 'refused')).toBe('tasted');
    expect(statusFromOutcome('tasted', 'liked')).toBe('liked');
    expect(statusFromOutcome(null, 'refused')).toBe('refused');
  });
  it('refus : nombre de propositions, de refus, dernier état donné tel quel', () => {
    const r = refusals([t('broccoli', '2026-11-10', 'refused'), t('broccoli', '2026-11-14', 'tasted'), t('zucchini', '2026-11-12', 'refused'), t('zucchini', '2026-11-15', 'refused'), t('carrot', '2026-11-01', 'liked')]);
    expect(r.map((x) => [x.food_key, x.offered, x.refused, x.lastRefused, x.lastStatus])).toEqual([['zucchini', 2, 2, '2026-11-15', 'refused'], ['broccoli', 2, 1, '2026-11-10', 'tasted']]);
  });
  it('textes : aucun jugement (« difficile », « capricieux »…) et sécurité reprise du guide sourcé', () => {
    for (const l of LANGS) {
      setLocale(l);
      for (const k of ['ref.intro', 'ref.line', 'ref.none', 'blw.intro', 'ref.track.hint'] as TKey[]) {
        expect(tr(k, { name: 'Lina', offered: 3, refused: 1 })).not.toMatch(/(difficile|capricieu|mauvais|picky|fussy|schwierig|caprichos|capriccios)/i);
      }
    }
    setLocale('fr');
    expect(read('src/content/articles/guide/b03.ts')).toMatch(/toujours assis et sous surveillance/);
    expect(read('src/content/articles/guide/b03.ts')).toMatch(/ne peut plus respirer, tousser ou crier, appelle immédiatement le 15 ou le 112/);
    expect(tr('blw.safety')).toMatch(/15 ou le 112/);
  });
});

describe('démonstration : mêmes règles que la base (20261129400100)', () => {
  const tables: Record<string, Record<string, unknown>[]> = {};
  const T = (n: string) => (tables[n] ??= []);
  let me = 'cam';
  const absents = createAbsents({ T: T as never, me: () => me, nowIso: () => new Date().toISOString(), uuid: () => Math.random().toString(36).slice(2), missionRpc: () => ({}) });
  beforeAll(() => {
    T('household_members').push({ household_id: 'h', user_id: 'cam', role: 'owner' }, { household_id: 'h', user_id: 'sam', role: 'coparent' }, { household_id: 'h', user_id: 'nn', role: 'caregiver' });
    T('children').push({ id: 'k', household_id: 'h' });
    T('pumpings').push({ id: 'p', household_id: 'h', amount_ml: 200 });
  });
  it('analyses et souvenirs : tables personnelles', () => {
    expect(PERSONAL_TABLES.lab_results).toBe('user_id');
    expect(PERSONAL_TABLES.pregnancy_memories).toBe('user_id');
  });
  it('relais : parents seulement ; personne choisie = un parent', () => {
    const row = { id: 'r', household_id: 'h', child_id: 'k', planned_at: new Date().toISOString(), assigned_to: 'sam' };
    absents.beforeInsert('bottle_relays', row);
    T('bottle_relays').push(row);
    expect(row).toMatchObject({ status: 'planned', created_by: 'cam' });
    expect(() => absents.beforeInsert('bottle_relays', { ...row, id: 'r2', assigned_to: 'nn' })).toThrow();
    me = 'nn';
    expect(absents.filter('bottle_relays', T('bottle_relays'))).toEqual([]);
    expect(() => absents.beforeInsert('bottle_relays', { ...row, id: 'r3', assigned_to: 'cam' })).toThrow();
    me = 'sam';
    expect(absents.filter('bottle_relays', T('bottle_relays'))).toHaveLength(1);
    me = 'cam';
  });
  it('contenants d’une séance : jamais plus que la quantité tirée ; refus et issue cohérents', () => {
    const base = { household_id: 'h', pumping_id: 'p', expressed_at: '2026-11-20T08:00:00Z', use_by: '2026-11-22T08:00:00Z', location: 'fridge' };
    const a = { ...base, id: 'a', amount_ml: 150 };
    absents.beforeInsert('milk_stock', a); T('milk_stock').push(a);
    expect(() => absents.beforeInsert('milk_stock', { ...base, id: 'b', amount_ml: 60 })).toThrow();
    expect(() => absents.beforeInsert('milk_stock', { ...base, id: 'c', amount_ml: 50 })).not.toThrow();
    expect(() => absents.beforeInsert('meals', { foods: ['carotte'], refused_foods: ['poire'] })).toThrow();
    expect(() => absents.beforeInsert('food_tastings', { status: 'tasted', outcome: 'refused' })).toThrow();
    expect(() => absents.beforeInsert('food_tastings', { status: 'refused', outcome: 'refused' })).not.toThrow();
  });
});

describe('routes et branchements (écrans existants étendus)', () => {
  it('routes existantes, une seule nouvelle sous le coffre de documents', () => {
    for (const r of ['/documents/labs', '/me/diary', '/postpartum/support', '/postpartum/checkin', '/feeding/milk-stock', '/bottle/history', '/family/nights', '/feeding/difficulties', '/consult/questions', '/child/[id]/discoveries', '/track/[kind]']) {
      expect(APP_ROUTES as readonly string[]).toContain(r);
    }
  });
  it('les écrans reçoivent les paramètres des parcours', () => {
    expect(read('src/app/me/diary.tsx')).toMatch(/tab === 'pregnancy'/);
    expect(read('src/app/postpartum/support.tsx')).toMatch(/focus === 'postnatal'|=== 'postnatal'/);
    expect(read('src/app/bottle/history.tsx')).toMatch(/scope === 'all'/);
    expect(read('src/app/family/nights.tsx')).toMatch(/focus === 'bottles'|=== 'bottles'/);
    expect(read('src/app/child/[id]/discoveries.tsx')).toMatch(/mode === 'blw'/);
    expect(read('src/app/consult/questions.tsx')).toMatch(/'lactation'/);
  });
});
