import { estimateCycle } from '@/lib/domain/cycle';
import {
  calendarMonth, categoryOrder, daySummaryItems, effectiveFavorites, emptyDay, GOAL_FAVORITES, joinFr, planDay, planPeriodSelection,
  PILLS, rangesOf, readDay, togglePill, type DaySources,
} from '@/lib/domain/cycleDaily';
import {
  completedCycles, ecWindows, hasForbiddenClaim, insightCandidates, intercourseInfo, phaseOn, pregnancyTestFrom, todayInsight, trends, type InsightInput,
} from '@/lib/domain/cycleInsights';
import { parseCycleVoice } from '@/lib/domain/cycleVoice';
import { FR } from '@/i18n/dictionaries';

const P = (id: string, start: string, end: string | null = null, flow: string | null = null) => ({ id, start_date: start, end_date: end, flow });
const src = (over: Partial<DaySources> = {}): DaySources => ({ periods: [], symptom: null, fertility: null, ovulationTests: [], pregnancyTests: [], intercourse: [], contraception: [], ...over });

describe('catégories et favoris', () => {
  it('chaque pastille a un libellé, une seule catégorie', () => {
    const all = Object.values(PILLS).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const p of all) expect(FR[`c3.p.${p}`]).toBeDefined();
    expect(PILLS.mood).toHaveLength(10);
    expect(PILLS.body).toHaveLength(14);
    expect(PILLS.habits).toHaveLength(10);
  });
  it('favoris par objectif, 5 au plus, sans la vie sexuelle si elle est masquée', () => {
    expect(effectiveFavorites('cycle', null, false)).toEqual(['period', 'pain', 'mood', 'body', 'sleep']);
    expect(effectiveFavorites('ttc', [], true)).toEqual(GOAL_FAVORITES.ttc);
    expect(effectiveFavorites('ttc', [], false)).not.toContain('intercourse');
    expect(effectiveFavorites('avoid', ['pill', 'incident', 'period', 'mood', 'pain', 'sleep'], true)).toHaveLength(5);
    expect(effectiveFavorites('cycle', ['nope', 'mood'], true)).toEqual(['mood']);
    expect(categoryOrder('avoid', true)[0]).toBe('contraception');
    expect(categoryOrder('cycle', false)).not.toContain('intimacy');
  });
});

describe('journée : lecture, pastilles, plan d’enregistrement', () => {
  it('choix exclusifs (un seul flux, un seul résultat de test)', () => {
    let d = togglePill(emptyDay(), 'flow_light');
    d = togglePill(d, 'flow_heavy');
    expect(d.pills).toEqual(['flow_heavy']);
    d = togglePill(d, 'flow_heavy');
    expect(d.pills).toEqual([]);
  });
  it('règles commencées → insertion ; retirer → suppression ; flux mis à jour', () => {
    const next = togglePill(togglePill(emptyDay(), 'period_start'), 'flow_medium');
    expect(planDay('2026-10-10', emptyDay(), next, src())).toEqual([{ table: 'period_entries', op: 'insert', values: { start_date: '2026-10-10', end_date: null, flow: 'medium' } }]);
    const s = src({ periods: [P('p1', '2026-10-10', null, 'medium')] });
    const prev = readDay('2026-10-10', s);
    expect(prev.pills).toEqual(expect.arrayContaining(['period_start', 'flow_medium']));
    expect(planDay('2026-10-10', prev, emptyDay(), s)).toEqual([{ table: 'period_entries', op: 'delete', id: 'p1' }]);
    const heavy = togglePill(prev, 'flow_heavy');
    expect(planDay('2026-10-10', prev, heavy, s)).toEqual([{ table: 'period_entries', op: 'update', id: 'p1', values: { flow: 'heavy' } }]);
  });
  it('un début noté 2 jours plus tôt corrige les règles en cours plutôt que de les doubler', () => {
    const s = src({ periods: [P('p1', '2026-10-12')] });
    const ops = planDay('2026-10-10', emptyDay(), togglePill(emptyDay(), 'period_start'), s);
    expect(ops).toEqual([{ table: 'period_entries', op: 'update', id: 'p1', values: { start_date: '2026-10-10', flow: null } }]);
  });
  it('règles terminées ferme les règles en cours', () => {
    const s = src({ periods: [P('p1', '2026-10-10')] });
    const prev = readDay('2026-10-14', s);
    expect(planDay('2026-10-14', prev, togglePill(prev, 'period_end'), s)).toEqual([{ table: 'period_entries', op: 'update', id: 'p1', values: { end_date: '2026-10-14' } }]);
  });
  it('symptômes, humeur, sommeil, note → une fiche ; tout retirer → suppression', () => {
    let d = togglePill(togglePill(togglePill(emptyDay(), 'cramps'), 'sad'), 'difficult');
    d = { ...d, painIntensity: 3, note: ' fatiguée ' };
    const ops = planDay('2026-10-10', emptyDay(), d, src());
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ table: 'symptom_logs', op: 'insert', values: { symptom_keys: ['cramps'], moods: ['sad'], sleep_tags: ['difficult'], pain_intensity: 3, note: 'fatiguée' } });
    const s = src({ symptom: { id: 's1', logged_on: '2026-10-10', symptom_keys: ['cramps'], moods: ['sad'] } });
    const prev = readDay('2026-10-10', s);
    expect(planDay('2026-10-10', prev, emptyDay(), s)).toEqual([{ table: 'symptom_logs', op: 'delete', id: 's1' }]);
  });
  it('tests saisis (jamais une confirmation), glaire et température', () => {
    const d = { ...togglePill(togglePill(emptyDay(), 'ovu_positive'), 'mucus_egg_white'), temperature: 36.7 };
    const ops = planDay('2026-10-10', emptyDay(), d, src(), '2026-10-22T08:00:00.000Z');
    expect(ops).toEqual(expect.arrayContaining([
      { table: 'fertility_observations', op: 'insert', values: { observed_on: '2026-10-10', cervical_mucus: 'egg_white', bbt_celsius: 36.7 } },
      expect.objectContaining({ table: 'ovulation_tests', op: 'insert', values: expect.objectContaining({ result: 'positive', user_confirmed: true, analysis_method: 'manual' }) }),
    ]));
  });
  it('rapport non protégé, puis correction en protégé avec préservatif, puis suppression', () => {
    const d = togglePill(emptyDay(), 'sex_unprotected');
    const [ins] = planDay('2026-10-10', emptyDay(), d, src());
    expect(ins).toMatchObject({ table: 'intercourse_logs', op: 'insert', values: { condom: 'no', usual_contraception: 'no' } });
    const s = src({ intercourse: [{ id: 'i1', occurred_on: '2026-10-10', condom: 'no', usual_contraception: 'no' }] });
    const prev = readDay('2026-10-10', s);
    expect(prev.pills).toContain('sex_unprotected');
    const fixed = togglePill(togglePill(prev, 'sex_protected'), 'sex_condom');
    expect(planDay('2026-10-10', prev, fixed, s)).toEqual([{ table: 'intercourse_logs', op: 'update', id: 'i1', values: expect.objectContaining({ condom: 'yes', condom_incident: 'none' }) }]);
    expect(planDay('2026-10-10', prev, emptyDay(), s)).toEqual([{ table: 'intercourse_logs', op: 'delete', id: 'i1' }]);
  });
  it('contraception : prise, oubli (exclusifs), traitement nommé', () => {
    const d = { ...togglePill(togglePill(togglePill(emptyDay(), 'pill_taken'), 'pill_missed'), 'treatment'), treatment: 'Fer' };
    expect(d.pills).toEqual(['pill_missed', 'treatment']);
    const ops = planDay('2026-10-10', emptyDay(), d, src());
    expect(ops).toEqual([
      { table: 'contraception_logs', op: 'insert', values: { logged_on: '2026-10-10', kind: 'pill_missed', label: null } },
      { table: 'contraception_logs', op: 'insert', values: { logged_on: '2026-10-10', kind: 'treatment', label: 'Fer' } },
    ]);
  });
  it('résumé du jour : « fatigue, crampes légères et sommeil difficile »', () => {
    const d = { ...togglePill(togglePill(togglePill(emptyDay(), 'fatigue'), 'cramps'), 'difficult'), painIntensity: 2 };
    const items = daySummaryItems(d, (p) => (FR[`c3.p.${p}`] as string).toLowerCase(), (_p, l) => `${l} légères`);
    expect(`Aujourd’hui, tu as noté : ${joinFr(items)}.`).toBe('Aujourd’hui, tu as noté : fatigue, crampes légères et sommeil difficile.');
    const intimate = togglePill(d, 'sex_unprotected');
    expect(daySummaryItems(intimate, (p) => p, (_p, l) => l, true)).not.toContain('sex_unprotected');
  });
});

describe('calendrier et sélection de plusieurs jours', () => {
  const periods = [P('a', '2026-07-01', '2026-07-05'), P('b', '2026-07-29', '2026-08-02'), P('c', '2026-08-26', '2026-08-30'), P('d', '2026-09-23', '2026-09-27')];
  const est = estimateCycle(periods, '2026-10-05');
  it('règles notées, estimées, fenêtre fertile, ovulation, indicateurs', () => {
    const cells = calendarMonth(2026, 9, { periods, symptomDays: { '2026-10-03': 5 }, intimacyDays: new Set(['2026-10-04']), contraceptionDays: new Set(['2026-10-02']) }, est, '2026-10-05', { showIntimacy: true });
    expect(cells.length % 7).toBe(0);
    const c = (iso: string) => cells.find((x) => x.iso === iso)!;
    expect(c('2026-10-05').today).toBe(true);
    expect(c(est.nextPeriod!).period).toBe('predicted');
    expect(cells.some((x) => x.fertile)).toBe(true);
    expect(cells.filter((x) => x.ovulation)).toHaveLength(1);
    expect(c('2026-10-03').symptoms).toBe(3);
    expect(c('2026-10-04').intimacy).toBe(true);
    expect(c('2026-10-02').contraception).toBe(true);
    const hidden = calendarMonth(2026, 9, { periods, symptomDays: {}, intimacyDays: new Set(['2026-10-04']), contraceptionDays: new Set() }, est, '2026-10-05', { showIntimacy: false });
    expect(hidden.find((x) => x.iso === '2026-10-04')!.intimacy).toBe(false);
    const sep = calendarMonth(2026, 8, { periods, symptomDays: {}, intimacyDays: new Set(), contraceptionDays: new Set() }, est, '2026-10-05', { showIntimacy: true });
    expect(sep.find((x) => x.iso === '2026-09-24')!.period).toBe('logged');
  });
  it('plages continues ; fusion avec des règles qui se touchent', () => {
    expect(rangesOf(['2026-10-03', '2026-10-01', '2026-10-02', '2026-10-07'])).toEqual([{ from: '2026-10-01', to: '2026-10-03' }, { from: '2026-10-07', to: '2026-10-07' }]);
    expect(planPeriodSelection(['2026-10-01', '2026-10-02'], [])).toEqual([{ table: 'period_entries', op: 'insert', values: { start_date: '2026-10-01', end_date: '2026-10-02' } }]);
    expect(planPeriodSelection(['2026-09-28', '2026-09-29'], [P('d', '2026-09-23', '2026-09-27')])).toEqual([{ table: 'period_entries', op: 'update', id: 'd', values: { start_date: '2026-09-23', end_date: '2026-09-29' } }]);
  });
});

describe('« À savoir aujourd’hui »', () => {
  // 4 cycles complets de 28 jours, mal de dos noté 2 jours avant les règles dans 3 d'entre eux
  const periods = ['2026-05-06', '2026-06-03', '2026-07-01', '2026-07-29', '2026-08-26'].map((s, i) => P(`p${i}`, s, null));
  const logs = [{ date: '2026-06-01', items: ['back_pain'] }, { date: '2026-06-29', items: ['back_pain'] }, { date: '2026-07-27', items: ['back_pain', 'sad'] }];
  const today = '2026-09-20';
  const est = estimateCycle(periods, today);
  const base = (over: Partial<InsightInput> = {}): InsightInput => ({ today, periods, est, logs: [...logs, { date: today, items: ['back_pain'] }], todayItems: ['back_pain'], todayPain: 3, goal: 'cycle', premium: true, feedback: {}, ...over });

  it('phases et cycles complets', () => {
    expect(completedCycles(periods)).toHaveLength(4);
    expect(phaseOn(today, periods, est)).toBe('beforePeriod');
  });
  it('tendance seulement après plusieurs observations comparables', () => {
    expect(trends(periods, logs)).toEqual(expect.arrayContaining([expect.objectContaining({ item: 'back_pain', phase: 'beforePeriod', count: 3, total: 4 })]));
    expect(trends(periods.slice(0, 3), logs)).toEqual([]); // 2 cycles : jamais de tendance
    expect(trends(periods, [logs[0]])).toEqual([]); // une seule saisie : pas de tendance
  });
  it('Premium : « 3 de tes 4 derniers cycles » ; gratuit : information générale (tendance réservée)', () => {
    const p = todayInsight(base());
    expect(p).toMatchObject({ kind: 'trend', key: 'c3.ins.trendBefore', params: { symptom: 'back_pain', count: 3, total: 4 } });
    const f = todayInsight(base({ premium: false }));
    expect(f).toMatchObject({ kind: 'general', key: 'c3.ins.backPainBefore', params: { count: est.nextPeriod ? 3 : 0 }, trendLocked: true });
  });
  it('« Cela ne me correspond pas » écarte la carte ; jamais la sécurité', () => {
    const first = todayInsight(base());
    const next = todayInsight(base({ feedback: { [first.id]: 'not_me' } }));
    expect(next.id).not.toBe(first.id);
    const safety = todayInsight(base({ todayPain: 9, feedback: { 'safety:pain': 'not_me' } }));
    expect(safety).toMatchObject({ kind: 'safety', key: 'c3.ins.safetyPain', action: 'professional' });
  });
  it('symptôme nouveau et intense, ou persistant : pas banalisé', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, items: ['fatigue'] }));
    expect(insightCandidates(base({ logs: [...many, { date: today, items: ['pelvic_pain'] }], todayItems: ['pelvic_pain'], todayPain: 7 }))[0]).toMatchObject({ key: 'c3.ins.safetyNew' });
    const week = Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${String(14 + i).padStart(2, '0')}`, items: ['headache'] }));
    expect(insightCandidates(base({ logs: week, todayItems: ['headache'], todayPain: 4 })).some((x) => x.key === 'c3.ins.safetyPersistent')).toBe(true);
  });
  it('rapport non protégé ou oubli → information d’urgence en premier (après la sécurité)', () => {
    expect(todayInsight(base({ todayItems: ['sex_unprotected'] }))).toMatchObject({ kind: 'emergency', action: 'emergency' });
    expect(todayInsight(base({ todayItems: ['pill_missed'] }))).toMatchObject({ kind: 'emergency' });
  });
  it('glaire étirable : jamais une confirmation d’ovulation', () => {
    const fertileDay = est.fertileWindow!.end;
    const i = todayInsight(base({ today: fertileDay, todayItems: ['mucus_egg_white'], logs: [] }));
    expect(i.key).toBe('c3.ins.mucusFertile');
    expect(FR['c3.ins.mucusFertile']).toMatch(/ne confirme pas une ovulation/);
  });
  it('anticipation Premium : « souvent », jamais une certitude', () => {
    const i = insightCandidates(base({ todayItems: [], logs }));
    const a = i.find((x) => x.kind === 'anticipation');
    expect(a).toMatchObject({ params: { symptom: 'back_pain', count: 2 } });
    expect(insightCandidates(base({ todayItems: [], logs, premium: false })).some((x) => x.kind === 'anticipation')).toBe(false);
  });
  it('premiers cycles : carte générale', () => {
    const one = [P('x', '2026-10-01')];
    expect(todayInsight({ ...base(), periods: one, est: estimateCycle(one, '2026-10-20'), today: '2026-10-20', todayItems: [], logs: [] }).kind).toBe('general');
    expect(todayInsight({ ...base(), periods: [], est: estimateCycle([], '2026-10-20'), today: '2026-10-20', todayItems: [], logs: [] }).key).toBe('c3.ins.start');
  });
});

describe('après un rapport', () => {
  const periods = ['2026-07-01', '2026-07-29', '2026-08-26', '2026-09-23'].map((s, i) => P(`p${i}`, s));
  const est = estimateCycle(periods, '2026-10-05');
  const flags = { protected: false, condom: false, contraception: false, incident: false, forgot: false, unprotected: true };
  it('dans la fenêtre / en dehors / informations insuffisantes : textes exacts', () => {
    expect(intercourseInfo('2026-10-07', periods, est, flags).textKey).toBe('c3.sex.fertile');
    expect(intercourseInfo('2026-09-25', periods, est, flags).textKey).toBe('c3.sex.outside');
    expect(intercourseInfo('2026-10-07', [], estimateCycle([], '2026-10-07'), flags).textKey).toBe('c3.sex.insufficient');
    expect(FR['c3.sex.fertile']).toBe('Ce rapport se situe dans ta période fertile estimée. Une grossesse est possible. Cette estimation ne permet pas de calculer précisément ton risque personnel.');
    expect(FR['c3.sex.outside']).toBe('Ce rapport semble se situer en dehors de ta période fertile estimée. Une grossesse reste néanmoins possible, car l’ovulation peut varier.');
    expect(FR['c3.sex.insufficient']).toBe('Nous ne disposons pas d’assez d’informations pour situer ce rapport dans ton cycle.');
    expect(FR['c3.sex.protection']).toBe('Protection déclarée par l’utilisatrice');
  });
  it('protection déclarée ; non protégé ou incident → informations d’urgence', () => {
    const p = intercourseInfo('2026-10-07', periods, est, { ...flags, unprotected: false, protected: true, condom: true });
    expect(p).toMatchObject({ protectionDeclared: true, needsEmergencyInfo: false });
    expect(intercourseInfo('2026-10-07', periods, est, { ...flags, unprotected: false, protected: true, condom: true, incident: true }).needsEmergencyInfo).toBe(true);
  });
  it('délais officiels et test de grossesse', () => {
    expect(ecWindows(80).map((w) => [w.id, w.open])).toEqual([['levonorgestrel', false], ['ulipristal', true], ['iud', true]]);
    expect(pregnancyTestFrom('2026-10-07')).toBe('2026-10-28');
  });
  it('aucune formulation interdite dans les textes du module', () => {
    for (const [k, v] of Object.entries(FR)) {
      if (!k.startsWith('c3.')) continue;
      for (const s of typeof v === 'string' ? [v] : Object.values(v)) {
        expect([k, hasForbiddenClaim(s as string)]).toEqual([k, false]);
        expect([k, /\d+\s?%/.test(s as string) && k !== 'c3.ec.pharmacy']).toEqual([k, false]);
      }
    }
    expect(hasForbiddenClaim('La contraception d’urgence est inutile ici.')).toBe(true);
    expect(hasForbiddenClaim('Pas besoin de pilule du lendemain.')).toBe(true);
    expect(hasForbiddenClaim('Une contraception d’urgence peut être utilisée.')).toBe(false);
    expect(hasForbiddenClaim('Pas besoin de contraception d’urgence.')).toBe(true);
  });
});

describe('saisie vocale', () => {
  it('reconnaît, à confirmer ensuite', () => {
    expect(parseCycleVoice('crampes fortes, fatiguée, règles abondantes')).toEqual({ pills: ['flow_heavy', 'cramps', 'fatigue'], painIntensity: 7, temperature: null });
    expect(parseCycleVoice('mal au dos 6/10 et mal dormi').painIntensity).toBe(6);
    expect(parseCycleVoice('j’ai oublié ma pilule').pills).toEqual(['pill_missed']);
    expect(parseCycleVoice('température 36,6 °C').temperature).toBe(36.6);
    expect(parseCycleVoice('rien de spécial').pills).toEqual([]);
  });
});
