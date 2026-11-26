/**
 * Contractions (39), projet de naissance (44), préparation du coparent (48), rééducation et cicatrisation (58/60),
 * stock de lait (73/74), difficultés d'allaitement (76/77), laits infantiles (79) — logique pure.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string };
const read = (rel: string) => fs.readFileSync(`${process.cwd()}/src/${rel}`, 'utf8');
import { setLocale } from '@/i18n';
import { APP_ROUTES } from '@/lib/routes.generated';
import { clock, currentSessionId, exportSections, fmtSec, shortSec, running, sessions, timed, windowStats, type Contraction } from '@/features/birth/contractions';
import { cleanAnswers, PLAN_SECTIONS, planSections, progress, toggleChoice } from '@/features/birth/birthPlan';
import { groupOfPosition, keyOfPosition, PREP_ITEMS, prepText, templateRows } from '@/features/birth/partnerPrep';
import { reminderAt, sessionCounts, splitSessions, validPain, type CareLog } from '@/features/postpartumCare/domain';
import { alertAt, defaultUseBy, fifo, freshness, SOURCED_KEEP_HOURS, thaw, totals, unstoredPumpings, validateMilk, type MilkItem } from '@/features/feeding/milkStock';
import { byDay, nearestFeed, suggestedQuestions, type FeedingIssue } from '@/features/feeding/issues';
import { closePrevious, current, localDay, timelineLine, validateFormula, type FormulaChange } from '@/features/feeding/formula';

beforeAll(() => setLocale('fr'));

const at = (min: number) => new Date(Date.UTC(2026, 10, 27, 10, 0) + min * 60_000).toISOString();
const c = (id: string, start: number, durSec: number | null, session = 's1'): Contraction => ({ id, session_id: session, started_at: at(start), ended_at: durSec == null ? null : new Date(Date.parse(at(start)) + durSec * 1000).toISOString() });

describe('39 chronomètre des contractions : horodatages absolus', () => {
  const list = [c('a', 0, 50), c('b', 6, 60), c('c', 11, 70), c('d', 15, null)];
  it('durée, intervalle début → début, contraction en cours', () => {
    const t = timed(list);
    expect(t.map((x) => x.durationSec)).toEqual([50, 60, 70, null]);
    expect(t.map((x) => x.intervalSec)).toEqual([null, 360, 300, 240]);
    expect(running(list)?.id).toBe('d');
    expect(currentSessionId(list)).toBe('s1');
  });
  it('moyennes sur 30 et 60 minutes (contractions terminées seulement pour la durée)', () => {
    const now = new Date(Date.parse(at(16)));
    const s = windowStats(list, 30, now);
    expect(s.count).toBe(3);
    expect(s.avgDurationSec).toBe(60);
    expect(s.avgIntervalSec).toBe(300);
    const later = new Date(Date.parse(at(50)));
    expect(windowStats(list, 30, later).count).toBe(0);
    expect(windowStats(list, 60, later).count).toBe(3);
  });
  it('rien ne dépend de la mémoire : la reprise après fermeture donne le même chronomètre', () => {
    expect(clock(at(15), new Date(Date.parse(at(16)) + 5000))).toBe('1:05');
    expect(clock(at(0), new Date(Date.parse(at(75))))).toBe('1:15:00');
  });
  it('séances et export pour la maternité, sans seuil ni interprétation', () => {
    const all = [...list, c('x', -300, 40, 's0')];
    expect(sessions(all).map((s) => s.id)).toEqual(['s1', 's0']);
    const ex = exportSections(all, new Date(Date.parse(at(16))));
    expect(ex[0].heading).toBe('Moyennes');
    expect(ex[1].lines[1]).toMatch(/durée 1 min 00 s · intervalle 6 min 00 s/);
    expect(JSON.stringify(ex)).not.toMatch(/partez|urgence|hôpital|alerte/i);
    expect(fmtSec(45)).toBe('45 s');
    expect(shortSec(65)).toBe('1:05');
    expect(fmtSec(null)).toBe('—');
  });
  it('écran : aucun seuil médical, rappel fixe vers la maternité et les numéros d’urgence', () => {
    const src = read('app/pregnancy/contractions.tsx');
    expect(src).toMatch(/ctr\.followAdvice/);
    expect(src).toMatch(/\/emergency/);
    expect(src).not.toMatch(/5-1-1|311|<\s*5\s*\*\s*60/);
  });
});

describe('44 projet de naissance', () => {
  it('sections et choix connus seulement ; note ≤ 1000 ; modifiable', () => {
    let a = toggleChoice({}, 'support', 'partner');
    a = toggleChoice(a, 'support', 'doula');
    a = toggleChoice(a, 'support', 'doula');
    a = { ...a, ambiance: { choices: ['dim_light', 'inconnu'] }, piratage: { choices: ['x'] }, other: { note: 'x'.repeat(1500) } };
    const clean = cleanAnswers(a);
    expect(clean.support.choices).toEqual(['partner']);
    expect(clean.ambiance.choices).toEqual(['dim_light']);
    expect(clean).not.toHaveProperty('piratage');
    expect(clean.other.note).toHaveLength(1000);
    expect(progress(clean)).toEqual({ filled: 3, total: PLAN_SECTIONS.length });
  });
  it('aperçu imprimable : titres et choix traduits', () => {
    const s = planSections({ support: { choices: ['partner'], note: 'Ma sœur' }, feeding: { choices: ['undecided'] } });
    expect(s).toEqual([{ heading: 'Accompagnement', lines: ['• Le coparent présent', 'Ma sœur'] }, { heading: 'Alimentation du bébé', lines: ['• Pas encore décidé'] }]);
  });
});

describe('48 préparation du coparent : modèle de liste', () => {
  it('positions du modèle → groupes ; points ajoutés à la main : « Autres »', () => {
    const rows = templateRows();
    expect(rows).toHaveLength(PREP_ITEMS.length);
    expect(groupOfPosition(rows[0].position)).toBe('numbers');
    expect(keyOfPosition(rows[4].position)).toBe('route_known');
    expect(groupOfPosition(123451)).toBeNull();
    expect(prepText('Liste', [{ label: 'Numéro', done: true, note: '01' }])).toBe('Liste\n\n☑ Numéro : 01');
  });
});

describe('58 / 60 post-partum', () => {
  const log = (o: Partial<CareLog>): CareLog => ({ id: 'x', user_id: 'u', kind: 'pelvic_session', at: at(0), status: 'planned', practitioner: null, feeling: null, pain: null, note: null, document_id: null, reminder_id: null, created_at: at(0), updated_at: at(0), ...o });
  it('séances à venir, à confirmer, passées ; repères (pas un score)', () => {
    const now = new Date(Date.parse(at(600)));
    const s = splitSessions([log({ id: 'a', at: at(1200) }), log({ id: 'b', at: at(0) }), log({ id: 'c', at: at(-2000), status: 'done' }), log({ id: 'h', kind: 'healing', status: null })], now);
    expect(s.upcoming.map((x) => x.id)).toEqual(['a']);
    expect(s.toConfirm.map((x) => x.id)).toEqual(['b']);
    expect(s.past.map((x) => x.id)).toEqual(['c']);
    expect(sessionCounts([log({}), log({ status: 'done' })])).toEqual({ done: 1, planned: 1 });
  });
  it('rappel une heure avant, jamais dans le passé ; douleur 0–10', () => {
    expect(reminderAt(at(120), 60, new Date(Date.parse(at(0))))).toBe(at(60));
    expect(reminderAt(at(30), 60, new Date(Date.parse(at(0))))).toBeNull();
    expect(validPain(10)).toBe(true);
    expect(validPain(11)).toBe(false);
    expect(validPain(2.5)).toBe(false);
  });
});

describe('73 / 74 stock de lait : durées sourcées, plus ancien d’abord, alertes', () => {
  const item = (o: Partial<MilkItem>): MilkItem => ({ id: 'm', household_id: 'h', child_id: null, pumping_id: null, expressed_at: at(0), amount_ml: 100, location: 'fridge', thawed_at: null,
    use_by: defaultUseBy(at(0), 'fridge'), status: 'stored', closed_at: null, note: null, created_by: null, created_at: at(0), updated_at: at(0), ...o });
  it('durées : uniquement celles du guide HOMI (b36.ts, mpedia d’après l’Anses)', () => {
    const guide = read('content/articles/guide/b36.ts');
    expect(guide).toMatch(/Température ambiante \(19 à 22 °C\) : \*\*1 heure maximum\*\*/);
    expect(guide).toMatch(/Réfrigérateur \(4 °C ou moins\) : \*\*48 heures\*\*/);
    expect(guide).toMatch(/Congélateur \(−18 °C\) : \*\*4 mois\*\*/);
    expect(guide).toMatch(/Lait décongelé : au réfrigérateur, puis à utiliser dans les 24 heures/);
    expect(SOURCED_KEEP_HOURS.room).toBe(1);
    expect(SOURCED_KEEP_HOURS.fridge).toBe(48);
    expect(defaultUseBy('2026-01-31T10:00:00.000Z', 'freezer').slice(0, 10)).toBe('2026-05-31');
  });
  it('décongélation : 24 h au réfrigérateur, jamais plus tard que la date prévue', () => {
    const t = thaw({ use_by: '2027-01-01T00:00:00.000Z' }, new Date(Date.parse(at(0))));
    expect(t.location).toBe('fridge');
    expect(t.use_by).toBe(new Date(Date.parse(at(0)) + 24 * 3600_000).toISOString());
    expect(thaw({ use_by: at(60) }, new Date(Date.parse(at(0)))).use_by).toBe(at(60));
  });
  it('FIFO, fraîcheur, rappel avant échéance, totaux', () => {
    const list = [item({ id: 'new', expressed_at: at(600) }), item({ id: 'old', expressed_at: at(-6000), location: 'freezer', use_by: defaultUseBy(at(-6000), 'freezer') }), item({ id: 'used', status: 'used', closed_at: at(1) })];
    expect(fifo(list).map((x) => x.id)).toEqual(['old', 'new']);
    const fresh = item({});
    expect(freshness(fresh, new Date(Date.parse(at(60))))).toBe('ok');
    expect(freshness(fresh, new Date(Date.parse(at(48 * 60 - 120))))).toBe('soon');
    expect(freshness(fresh, new Date(Date.parse(at(48 * 60 + 1))))).toBe('expired');
    expect(alertAt(fresh, new Date(Date.parse(at(0))))).toBe(at(42 * 60));
    expect(totals(list)).toMatchObject({ fridge: { count: 1, ml: 100 }, freezer: { count: 1, ml: 100 } });
  });
  it('relié au tire-lait : les séances déjà rangées ne sont plus proposées', () => {
    const p = [{ id: 'p1', amount_ml: 120, at: at(0) }, { id: 'p2', amount_ml: 80, at: at(10) }, { id: 'p0', amount_ml: 0, at: at(5) }];
    expect(unstoredPumpings(p, [item({ pumping_id: 'p1' })], 72, new Date(Date.parse(at(60)))).map((x) => x.id)).toEqual(['p2']);
    expect(validateMilk({ amount: 0, expressedAt: at(0), useBy: at(10) })).toBe('milk.err.amount');
    expect(validateMilk({ amount: 100, expressedAt: at(10), useBy: at(0) })).toBe('milk.err.useBy');
  });
});

describe('76 / 77 difficultés et douleurs d’allaitement', () => {
  const issue = (o: Partial<FeedingIssue>): FeedingIssue => ({ id: 'i', user_id: 'u', child_id: 'k', breastfeed_id: null, at: at(0), side: 'left', kind: 'sore_nipple', pain: 6, note: null, created_at: at(0), ...o });
  it('historique par jour avec les tétées notées, douleur la plus forte', () => {
    const feeds = [{ id: 'f1', started_at: at(-5), ended_at: at(10), side: 'left' as const }, { id: 'f2', started_at: at(180), ended_at: null, side: 'right' as const }];
    const d = byDay([issue({ id: 'a' }), issue({ id: 'b', pain: 3, at: at(185) })], feeds);
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ feeds: 2, maxPain: 6 });
    expect(nearestFeed(feeds, at(0))?.id).toBe('f1');
    expect(nearestFeed(feeds, at(400))).toBeNull();
  });
  it('questions pour la consultante, sans diagnostic', () => {
    const q = suggestedQuestions([issue({ kind: 'engorgement' })], new Date(Date.parse(at(60))));
    expect(q).toEqual(['Comment soulager les seins tendus ou un canal bouché ?', 'Quelles positions d’allaitement pourrais-je essayer ?']);
  });
});

describe('79 laits infantiles', () => {
  const f = (o: Partial<FormulaChange>): FormulaChange => ({ id: 'f', household_id: 'h', child_id: 'k', brand: 'Lait A', kind: 'first_age', started_on: '2026-01-01', ended_on: null, reason: null, observations: null,
    created_by: null, created_at: at(0), updated_at: at(0), ...o });
  it('lait actuel, période précédente close la veille, validation', () => {
    const list = [f({ id: 'a' }), f({ id: 'b', brand: 'Lait B', started_on: '2026-06-01', kind: 'second_age' })];
    expect(current(list, '2026-07-01')?.id).toBe('b');
    expect(closePrevious([f({ id: 'a' })], '2026-06-01')).toEqual({ id: 'a', ended_on: '2026-05-31' });
    expect(validateFormula({ brand: ' ', startedOn: '2026-01-01', endedOn: null }, '2026-07-01')).toBe('fml.err.brand');
    expect(validateFormula({ brand: 'X', startedOn: '2026-08-01', endedOn: null }, '2026-07-01')).toBe('fml.err.future');
    expect(validateFormula({ brand: 'X', startedOn: '2026-06-01', endedOn: '2026-05-01' }, '2026-07-01')).toBe('fml.err.end');
    expect(timelineLine(f({ ended_on: '2026-05-31', reason: 'age' })).title).toBe('Lait A · 1er âge');
  });

  it('dates « AAAA-MM-JJ » lues en jour local (pas minuit UTC)', () => {
    const d = localDay('2026-06-01');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 5, 1]);
  });
});

describe('routes des outils', () => {
  it('chaque écran existe', () => {
    for (const r of ['/family/calm', '/family/moments', '/pregnancy/contractions', '/pregnancy/birth-plan', '/family/birth-partner', '/postpartum/pelvic',
      '/postpartum/healing', '/feeding/milk-stock', '/feeding/difficulties', '/feeding/formula']) expect(APP_ROUTES).toContain(r);
  });
});
