import { bleedingOrientation, cycleDayOn, cycleStats, dischargeOrientation, guidesFor, monthCells, symptomKeysOf } from '@/lib/domain/cycleV2';
import { GUIDES, SOURCES, guideBySlug } from '@/content/dischargeGuides';

describe('symptômes', () => {
  it('anciennes saisies en français relues comme des clés', () => {
    expect(symptomKeysOf({ symptoms: ['Crampes', 'Maux de tête', 'inconnu'], symptom_keys: ['fatigue'] }).sort()).toEqual(['cramps', 'fatigue', 'headache']);
  });
});

describe('pertes : fiches et orientation (jamais de diagnostic)', () => {
  it('fiches proposées selon ce qui est observé', () => {
    expect(guidesFor({ color: 'clear', textures: ['elastic', 'slippery'] })).toEqual(['clear-fluid', 'stretchy-slippery']);
    expect(guidesFor({ color: 'white', textures: ['lumpy'], symptoms: ['itching'] })).toEqual(['white-creamy', 'thick-lumpy', 'itching']);
    expect(guidesFor({ symptoms: ['dryness'] })).toEqual(['dryness']);
  });
  it('orientation', () => {
    expect(dischargeOrientation({ color: 'clear', textures: ['elastic'], odor: 'none', symptoms: ['none'] })).toBe('none');
    expect(dischargeOrientation({ color: 'greenish' })).toBe('see_soon');
    expect(dischargeOrientation({ odor: 'unusual' })).toBe('see_soon');
    expect(dischargeOrientation({ symptoms: ['itching'] })).toBe('see_soon');
    expect(dischargeOrientation({ amount: 'very_heavy' })).toBe('mention');
    expect(dischargeOrientation({ color: 'brown', pregnancy: 'possible', symptoms: ['pain'] })).toBe('urgent');
    expect(dischargeOrientation({ color: 'pink', pregnancy: 'known' })).toBe('see_soon');
  });
});

describe('saignements inhabituels', () => {
  it('urgence : grossesse avec saignement abondant ou douleur, ou saignement très abondant', () => {
    expect(bleedingOrientation({ kind: 'during_pregnancy', amount: 'spotting', pain: true })).toBe('urgent');
    expect(bleedingOrientation({ kind: 'unknown_origin', amount: 'light', pregnancy: 'possible', pain: false })).toBe('see_soon');
    expect(bleedingOrientation({ kind: 'between_periods', amount: 'very_heavy' })).toBe('urgent');
    expect(bleedingOrientation({ kind: 'after_sex', amount: 'spotting' })).toBe('see_soon');
    expect(bleedingOrientation({ kind: 'pink_brown', amount: 'spotting', pregnancy: 'no' })).toBe('mention');
  });
});

describe('statistiques descriptives', () => {
  const periods = [
    { start_date: '2026-06-01', end_date: '2026-06-05', flow: 'medium' },
    { start_date: '2026-06-29', end_date: '2026-07-03', flow: 'heavy' },
    { start_date: '2026-07-28', end_date: '2026-08-01', flow: 'very_heavy' },
    { start_date: '2026-08-25', end_date: null, flow: 'spotting' },
  ];
  it('durées des cycles et des règles, flux', () => {
    const s = cycleStats(periods, [
      { logged_on: '2026-06-02', symptom_keys: ['cramps'], mood: 2, energy: 3 },
      { logged_on: '2026-06-30', symptoms: ['Crampes', 'Fatigue'], mood: 4 },
    ]);
    expect(s.cycles.map((c) => c.length)).toEqual([28, 29, 28]);
    expect(s.averageLength).toBe(28.3);
    expect([s.shortest, s.longest]).toEqual([28, 29]);
    expect(s.periodDurations).toEqual([5, 5, 5]);
    expect(s.flowCounts).toEqual({ medium: 1, heavy: 1, very_heavy: 1, spotting: 1 });
    expect(s.symptomCounts[0]).toEqual({ key: 'cramps', count: 2 });
    expect(s.wellbeing).toMatchObject({ mood: 3, energy: 3, days: 2 });
  });
  it('sans données : rien d’inventé', () => {
    const s = cycleStats([], []);
    expect([s.averageLength, s.averagePeriod, s.cycles.length]).toEqual([null, null, 0]);
  });
});

describe('calendrier : enregistré ≠ estimé', () => {
  const periods = [{ start_date: '2026-08-25', end_date: '2026-08-29' }, { start_date: '2026-09-22', end_date: '2026-09-26' }];
  const cells = monthCells(2026, 9, { periods, symptoms: [{ logged_on: '2026-10-03' }], discharge: [{ observed_at: '2026-10-05T08:00:00Z' }], bleeding: [], tests: [], journal: [{ entry_on: '2026-10-05' }] }, '2026-10-01');
  it('grille du lundi au dimanche, jours du mois', () => {
    expect(cells.length % 7).toBe(0);
    expect(cells[0].iso).toBe('2026-09-28');
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
  });
  it('règles estimées distinctes des enregistrées ; jamais les deux le même jour', () => {
    expect(cells.some((c) => c.estimatedPeriod)).toBe(true);
    expect(cells.some((c) => c.period && c.estimatedPeriod)).toBe(false);
    expect(cells.find((c) => c.iso === '2026-10-20')?.estimatedPeriod).toBe(true);
    expect(cells.find((c) => c.iso === '2026-10-05')).toMatchObject({ discharge: true, journal: true });
  });
  it('jour du cycle', () => {
    expect(cycleDayOn(periods, '2026-10-01')).toBe(10);
    expect(cycleDayOn([], '2026-10-01')).toBeNull();
  });
});

describe('fiches pédagogiques', () => {
  it('10 fiches FR + EN complètes, sources citées existantes, aucune promesse ni diagnostic', () => {
    expect(GUIDES).toHaveLength(10);
    for (const g of GUIDES) {
      for (const l of [g.fr, g.en]) {
        expect(l.title && l.intro && l.limits).toBeTruthy();
        expect(l.observe.length && l.variations.length && l.note.length && l.seek.length).toBeTruthy();
        expect(`${l.intro} ${l.limits}`).not.toMatch(/\b(c'est|c’est) (une|un) (mycose|infection|vaginose)\b|\bvous avez (une|un)\b|\byou have (a|an)\b/i);
      }
      for (const s of g.sources) expect(SOURCES[s]?.url).toMatch(/^https:\/\//);
    }
    expect(guideBySlug('stretchy-slippery')!.fr.limits).toMatch(/ni une preuve d’ovulation, ni une méthode de contraception/);
  });
});

// ---------------------------------------------------------------- libellés des listes de valeurs (clés construites dynamiquement)
import { DICTIONARIES } from '@/i18n/dictionaries';
import { BLEEDING_KINDS, DISCHARGE as D, FLOWS as F, SYMPTOM_KEYS as SK } from '@/lib/domain/cycleV2';
import { REPORT_PARTS } from '@/features/cycle/report';

describe('libellés du cycle', () => {
  const keys = [
    ...F.map((f) => `cy.flow.${f}`), ...SK.map((k) => `cy.sym.${k}`),
    ...Object.entries(D).flatMap(([g, vs]) => (vs as readonly string[]).map((v) => `cy.dis.${g}.${v}`)),
    ...BLEEDING_KINDS.map((k) => `cy.bl.kind.${k}`), ...['spotting', 'light', 'moderate', 'heavy', 'very_heavy'].map((k) => `cy.bl.amount.${k}`),
    ...['insufficient', 'low', 'moderate'].map((k) => `cy.reliability.${k}`), ...['negative', 'positive', 'peak', 'invalid', 'faint'].map((k) => `cy.test.r.${k}`),
    ...REPORT_PARTS.map((p) => `cy.ex.part.${p}`), ...['3', '6', '12', 'all'].map((r) => `cy.ex.range.${r}`),
    ...['period', 'estimate', 'fertile', 'symptom', 'discharge', 'note'].map((k) => `cy.cal.legend.${k}`), 'cy.sym.int1', 'cy.sym.int2', 'cy.sym.int3',
    ...['calendar', 'symptoms', 'discharge', 'guides', 'bleeding', 'journal', 'stats', 'fertility', 'reminders', 'export', 'privacy', 'advice', 'pain', 'intimacy'].flatMap((k) => [`cy.nav.${k}`, `cy.nav.${k}.hint`]),
    ...['yes', 'no', 'unsure', 'prefer_not'].map((k) => `cy.ans.${k}`),
    ...['vaginal', 'other', 'prefer_not'].map((k) => `cy.sex.kind.${k}`),
    ...['none', 'broke', 'slipped', 'other', 'unsure'].map((k) => `cy.sex.condom_incident.${k}`),
    ...['pill', 'iud_copper', 'iud_hormonal', 'implant', 'patch', 'ring', 'injection', 'other'].map((k) => `cy.sex.contra_type.${k}`),
    ...['none', 'missed', 'late', 'misuse', 'other', 'unsure'].map((k) => `cy.sex.contra_incident.${k}`),
    ...['lower_abdomen', 'lower_left', 'lower_right', 'upper_abdomen', 'lower_back', 'thighs', 'chest', 'head', 'other'].map((k) => `cy.pain.zone.${k}`),
    ...['lt_hour', 'hours', 'day', 'days'].map((k) => `cy.pain.duration.${k}`),
    ...['before_period', 'during_period', 'outside_period', 'unsure'].map((k) => `cy.pain.onset.${k}`),
    ...['usual', 'new', 'worse', 'unsure'].map((k) => `cy.pain.pattern.${k}`),
    ...['none', 'sleep', 'work', 'studies', 'daily', 'stopped'].map((k) => `cy.pain.impact.${k}`),
    ...['nausea', 'vomiting', 'faint', 'fever', 'unusual_bleeding', 'outside_period', 'painful_sex'].map((k) => `cy.pain.assoc.${k}`),
    ...['helped', 'not_helped', 'none'].map((k) => `cy.pain.relief.${k}`),
    ...['none', 'mild', 'moderate', 'strong', 'severe'].map((k) => `cy.pain.level.${k}`),
    ...['period', 'follicular', 'fertile', 'ovulation', 'luteal', 'next'].flatMap((k) => [`cy.ring.legend.${k}`, `cy.ring.phase.${k}`, `cy.ring.short.${k}`, `cy.ring.detail.${k}`]),
    ...['info', 'practical', 'followup', 'consult', 'prompt', 'emergency'].map((k) => `adv.prio.${k}`),
    ...['learn', 'ec_info', 'pregnancy_risk', 'find_pro', 'edit', 'review', 'emergency'].map((k) => `adv.action.${k}`),
    ...['sex', 'pain', 'discharge', 'bleeding', 'cycle'].map((k) => `adv.ui.event.${k}`),
  ];
  it.each(['fr', 'en'])('toutes les valeurs ont un libellé (%s)', (lang) => {
    expect(keys.filter((k) => !DICTIONARIES[lang][k])).toEqual([]);
  });
});

// ---------------------------------------------------------------- rapport PDF
import { buildCycleReport } from '@/features/cycle/report';
import { buildTextPdf, pdfPageCount } from '@/lib/documents/pdf';

describe('rapport de cycle', () => {
  const data = {
    periods: [
      { id: 'a', user_id: 'u', start_date: '2026-05-01', end_date: '2026-05-05', flow: 'medium' as const, note: null },
      { id: 'b', user_id: 'u', start_date: '2026-09-01', end_date: '2026-09-04', flow: 'heavy' as const, note: null },
      { id: 'c', user_id: 'u', start_date: '2026-09-29', end_date: null, flow: null, note: null },
    ],
    symptoms: [{ id: 's', user_id: 'u', logged_on: '2026-09-02', symptoms: [], symptom_keys: ['cramps'], note: null, created_at: '', mood: 2 }],
    discharge: [], bleeding: [],
    journal: [{ id: 'j', user_id: 'u', entry_on: '2026-09-03', body: 'note très personnelle', mood: null }],
    tests: [{ kind: 'ovulation' as const, tested_at: '2026-09-14T08:00:00Z', result: 'peak' }],
  };
  it("n'inclut que les rubriques et la période choisies (journal exclu par défaut)", () => {
    const s = buildCycleReport(data, ['periods', 'symptoms', 'tests'], '2026-08-01', '2026-10-19');
    const text = JSON.stringify(s);
    expect(s.map((x) => x.heading)).toHaveLength(3);
    expect(text).not.toContain('note très personnelle');
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/); // dates formatées, jamais brutes
    expect(s[0].lines).toHaveLength(2); // les règles de mai sont hors période
  });
  it('inclut le journal seulement s’il est coché', () => {
    expect(JSON.stringify(buildCycleReport(data, ['journal'], null, '2026-10-19'))).toContain('note très personnelle');
  });
  it('fabrique un PDF lisible, paginé', async () => {
    const lines = Array.from({ length: 120 }, (_, i) => `Ligne ${i} — « texte » accentué éàü`);
    const bytes = await buildTextPdf('Suivi du cycle', ['Du 1 au 2'], [{ heading: 'Règles', lines }]);
    expect(await pdfPageCount(bytes)).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------- carte d'accueil
import { fullOrder, moveItem, resolveItems, resolveShortcuts } from '@/features/cycle/homeCard';
describe("carte « Mon cycle » de l'accueil", () => {
  it('utilise les éléments par défaut du parcours, puis le choix enregistré', () => {
    expect(resolveItems(null, 'cycle')).toContain('discharge');
    expect(resolveItems(null, 'ttc')).toContain('fertile');
    expect(resolveItems(['stats', 'inconnu', 'day'], 'cycle')).toEqual(['stats', 'day']);
    expect(resolveItems([], 'cycle')).toEqual([]);
  });
  it('limite les raccourcis à 4, sans doublon ni valeur inconnue', () => {
    expect(resolveShortcuts(['period', 'period', 'x', 'stats', 'journal', 'bleeding', 'guides'])).toEqual(['period', 'stats', 'journal', 'bleeding']);
  });
  it('réordonne sans perdre d’élément', () => {
    const o = fullOrder(['last', 'day']);
    expect(o.slice(0, 2)).toEqual(['last', 'day']);
    expect(o).toHaveLength(8);
    expect(moveItem(o, 'day', -1).slice(0, 2)).toEqual(['day', 'last']);
    expect(moveItem(o, 'last', -1)).toBe(o);
  });
});
