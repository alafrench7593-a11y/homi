/** Moteur de conseils : scénarios obligatoires, garde-fous, textes et sources. */
import { evaluateAdvice, fertileStatusOn, forEvent, type AdviceInput } from '@/lib/advice/engine';
import { ALL_RULES } from '@/lib/advice/rules';
import { ADVICE_SOURCES } from '@/lib/advice/sources';
import { DICTIONARIES } from '@/i18n/dictionaries';

const NOW = new Date('2026-10-19T10:00:00');
const TODAY = '2026-10-19';
// Règles régulières de 28 jours : 24/08, 21/09 → prochaines vers le 19/10, ovulation estimée ≈ 05/10, fenêtre ≈ 30/09–06/10
const PERIODS = [
  { id: 'p1', start_date: '2026-07-27', end_date: '2026-07-31' },
  { id: 'p2', start_date: '2026-08-24', end_date: '2026-08-28' },
  { id: 'p3', start_date: '2026-09-21', end_date: '2026-09-25' },
];
const base = (over: Partial<AdviceInput> = {}): AdviceInput => ({ now: NOW, today: TODAY, journey: 'cycle', pregnant: false, periods: PERIODS, pain: [], sex: [], discharge: [], bleeding: [], ...over });
const only = (input: AdviceInput, type: 'sex' | 'pain' | 'discharge' | 'bleeding', id = 'e1') => forEvent(evaluateAdvice(input), type, id);
const text = (lang: string, key: string) => String(DICTIONARIES[lang][key] ?? '');

describe('fenêtre fertile estimée', () => {
  it('reconnaît une date dans la fenêtre estimée, et reste une estimation', () => {
    expect(fertileStatusOn(PERIODS, '2026-10-03', 28, 'moderate').status).toBe('in');
    expect(fertileStatusOn(PERIODS, '2026-09-23', 28, 'moderate').status).toBe('out');
    expect(fertileStatusOn([], '2026-09-23', null, 'insufficient').status).toBe('unknown');
  });
});

describe('Test 1 — rapport non protégé pendant une période fertile estimée', () => {
  const sex = [{ id: 'e1', occurred_on: '2026-10-03', occurred_time: '22:00', condom: 'no', usual_contraception: 'no', pregnancy_wish: 'no' }];
  it('affiche un conseil contextualisé, rapide, avec contraception d’urgence et recherche de professionnel', () => {
    const now = new Date('2026-10-04T09:00:00');
    const [a] = only(base({ now, today: '2026-10-04', sex }), 'sex');
    expect(a.ruleId).toBe('sex_risk');
    expect(a.variant).toBe('h72');
    expect(a.priority).toBe('prompt');
    expect(a.actions).toEqual(expect.arrayContaining(['ec_info', 'find_pro', 'pregnancy_risk', 'edit']));
    expect(a.triggers.map((t) => t.key)).toEqual(expect.arrayContaining(['unprotected', 'fertile_in', 'wish_no']));
  });
  it('explique l’incertitude de l’ovulation et ne présente aucune grossesse comme certaine', () => {
    const fr = text('fr', 'adv.sex_risk.h72.body');
    expect(fr).toMatch(/estimation/);
    expect(fr).toMatch(/peut entraîner/);
    expect(fr).not.toMatch(/vous êtes enceinte|grossesse certaine|sans risque/i);
  });
  it('adapte le message selon le délai : 3 à 5 jours, puis délai dépassé', () => {
    expect(only(base({ now: new Date('2026-10-07T20:00:00'), today: '2026-10-07', sex }), 'sex')[0].variant).toBe('h120');
    const late = only(base({ sex }), 'sex')[0];
    expect(late.variant).toBe('passed');
    expect(late.priority).toBe('followup');
  });
  it('hors de la fenêtre estimée, le risque reste signalé (la fenêtre n’est jamais le seul critère)', () => {
    const [a] = only(base({ now: new Date('2026-09-24T09:00:00'), today: '2026-09-24', sex: [{ ...sex[0], occurred_on: '2026-09-23' }] }), 'sex');
    expect(a.ruleId).toBe('sex_risk');
    expect(a.triggers.map((t) => t.key)).toContain('fertile_out');
  });
  it('rupture de préservatif ou pilule oubliée : même conseil', () => {
    const n = new Date('2026-10-04T09:00:00');
    expect(only(base({ now: n, today: '2026-10-04', sex: [{ id: 'e1', occurred_on: '2026-10-03', condom: 'yes', condom_incident: 'broke' }] }), 'sex')[0].ruleId).toBe('sex_risk');
    expect(only(base({ now: n, today: '2026-10-04', sex: [{ id: 'e1', occurred_on: '2026-10-03', condom: 'no', usual_contraception: 'yes', contraception_incident: 'missed' }] }), 'sex')[0].ruleId).toBe('sex_risk');
  });
  it('après une contraception d’urgence : information de suivi, sans répéter l’alerte', () => {
    const list = only(base({ sex: [{ ...sex[0], ec_taken: 'yes' }] }), 'sex');
    expect(list).toHaveLength(1);
    expect(list[0].ruleId).toBe('sex_after_ec');
    expect(text('fr', 'adv.sex_after_ec.default.body')).toMatch(/sans l’exclure/);
  });
  it('après une consultation : le conseil est mis à jour (nouvelle signature), pas répété', () => {
    const before = only(base({ sex }), 'sex')[0];
    const after = only(base({ sex: [{ ...sex[0], professional_seen: 'yes' }] }), 'sex')[0];
    expect(after.variant).toBe('seen');
    expect(after.signature).not.toBe(before.signature);
  });
  it('grossesse souhaitée : aucune alerte de contraception d’urgence', () => {
    const list = only(base({ sex: [{ ...sex[0], pregnancy_wish: 'yes' }] }), 'sex');
    expect(list.map((a) => a.ruleId)).toEqual(['sex_ttc']);
  });
});

describe('Test 2 — rapport protégé sans incident', () => {
  it('aucune alerte, aucun message', () => {
    expect(only(base({ sex: [{ id: 'e1', occurred_on: '2026-10-03', condom: 'yes', condom_incident: 'none', pregnancy_wish: 'no' }] }), 'sex')).toEqual([]);
    expect(only(base({ sex: [{ id: 'e1', occurred_on: '2026-10-03', condom: 'no', usual_contraception: 'yes', contraception_incident: 'none' }] }), 'sex')).toEqual([]);
  });
  it('un rapport enregistré sans aucun détail ne déclenche rien', () => {
    expect(only(base({ sex: [{ id: 'e1', occurred_on: '2026-10-03' }] }), 'sex')).toEqual([]);
  });
});

describe('Test 3 — protection incertaine', () => {
  it('l’incertitude n’est pas transformée en « non » : question de précision et information', () => {
    const [a] = only(base({ now: new Date('2026-10-04T09:00:00'), today: '2026-10-04', sex: [{ id: 'e1', occurred_on: '2026-10-03', condom: 'unsure' }] }), 'sex');
    expect(a.ruleId).toBe('sex_clarify');
    expect(a.clarify).toBe('protection');
    expect(a.actions).toEqual(expect.arrayContaining(['edit', 'ec_info']));
    expect(a.priority).not.toBe('prompt');
  });
  it('pas de préservatif mais contraception non précisée : on demande, on ne présume pas', () => {
    const [a] = only(base({ sex: [{ id: 'e1', occurred_on: '2026-10-03', condom: 'no' }] }), 'sex');
    expect(a.ruleId).toBe('sex_clarify');
    expect(a.triggers.map((t) => t.key)).toContain('contra_unknown');
  });
});

describe('Test 4 — douleurs légères et habituelles', () => {
  it('pistes de confort, sans alerte', () => {
    const [a, ...rest] = only(base({ pain: [{ id: 'e1', logged_on: '2026-10-18', pain_intensity: 3, pain_pattern: 'usual', pain_impact: ['none'] }] }), 'pain');
    expect(rest).toEqual([]);
    expect(a.ruleId).toBe('pain_comfort');
    expect(a.priority).toBe('practical');
  });
});

describe('Test 5 — douleurs répétées affectant le quotidien', () => {
  it('proposition de suivi et de consultation, bouton de recherche', () => {
    const [a] = only(base({ pain: [{ id: 'e1', logged_on: '2026-10-18', pain_intensity: 6, pain_pattern: 'usual', pain_impact: ['work', 'sleep'] }] }), 'pain');
    expect(a.ruleId).toBe('pain_consult');
    expect(a.variant).toBe('impact');
    expect(a.actions).toContain('find_pro');
  });
  it('douleurs fortes sur trois cycles : tendance signalée seulement si les données la justifient', () => {
    const pain = [
      { id: 'a', logged_on: '2026-07-28', pain_intensity: 7, pain_pattern: 'usual', pain_relief: 'helped' },
      { id: 'b', logged_on: '2026-08-25', pain_intensity: 7, pain_pattern: 'usual', pain_relief: 'helped' },
      { id: 'e1', logged_on: '2026-09-22', pain_intensity: 6, pain_pattern: 'usual' },
    ];
    const input = base({ now: new Date('2026-09-22T10:00:00'), today: '2026-09-22', pain });
    expect(only(input, 'pain')[0].variant).toBe('recurring');
    expect(only({ ...input, pain: pain.slice(1) }, 'pain')[0].ruleId).toBe('pain_comfort');
  });
});

describe('Test 6 — douleurs importantes et symptômes associés', () => {
  it('douleur forte + malaise ou fièvre : urgence, aucun message rassurant', () => {
    const list = only(base({ pain: [{ id: 'e1', logged_on: '2026-10-18', pain_intensity: 8, pain_pattern: 'usual', pain_associated: ['faint'] }] }), 'pain');
    expect(list).toHaveLength(1);
    expect(list[0].priority).toBe('emergency');
    expect(list[0].actions[0]).toBe('emergency');
  });
  it('grossesse possible + douleur + saignement : urgence', () => {
    expect(only(base({ pain: [{ id: 'e1', logged_on: '2026-10-18', pain_intensity: 5, pain_associated: ['unusual_bleeding'], pain_pregnancy: 'possible' }] }), 'pain')[0].variant).toBe('pregnancy');
  });
  it('douleur forte non soulagée ou plus forte que d’habitude : avis rapide (pas un simple rendez-vous)', () => {
    const [a] = only(base({ pain: [{ id: 'e1', logged_on: '2026-10-18', pain_intensity: 8, pain_relief: 'not_helped', pain_pattern: 'usual' }] }), 'pain');
    expect(a.priority).toBe('prompt');
  });
  it('déjà eu des douleurs : pas de réassurance automatique d’une douleur forte et nouvelle', () => {
    const [a] = only(base({ pain: [{ id: 'e1', logged_on: '2026-10-18', pain_intensity: 9, pain_pattern: 'new' }] }), 'pain');
    expect(a.ruleId).toBe('pain_prompt');
  });
});

describe('Test 7 — pertes blanches sans autre symptôme', () => {
  it('information pédagogique, sans alerte', () => {
    const list = only(base({ discharge: [{ id: 'e1', observed_at: '2026-10-12T09:00:00Z', color: 'white', textures: ['creamy'], odor: 'none', symptoms: ['none'] }] }), 'discharge');
    expect(list).toHaveLength(1);
    expect(list[0].priority).toBe('info');
    expect(list[0].variant).toBe('white');
  });
  it('pertes claires et élastiques pendant la fenêtre estimée : sans confirmer l’ovulation', () => {
    const [a] = only(base({ discharge: [{ id: 'e1', observed_at: '2026-10-03T09:00:00Z', color: 'clear', textures: ['elastic'], symptoms: [] }] }), 'discharge');
    expect(a.variant).toBe('clear_fertile');
    expect(text('fr', 'adv.dis_info.clear_fertile.body')).toMatch(/ne confirme pas l’ovulation/);
  });
});

describe('Test 8 — pertes inhabituelles avec démangeaisons', () => {
  it('limites de l’observation, avis médical selon persistance, aucun traitement', () => {
    const list = only(base({ discharge: [{ id: 'e1', observed_at: '2026-10-12T09:00:00Z', color: 'white', textures: ['lumpy'], symptoms: ['itching'] }] }), 'discharge');
    expect(list).toHaveLength(1);
    expect(list[0].variant).toBe('itch');
    expect(list[0].priority).toBe('consult');
    const fr = text('fr', 'adv.dis_signs.itch.body');
    expect(fr).toMatch(/Plusieurs causes/);
    expect(fr).toMatch(/persistent/);
  });
  it('la couleur seule n’est pas une preuve d’infection', () => {
    const [a] = only(base({ discharge: [{ id: 'e1', observed_at: '2026-10-12T09:00:00Z', color: 'greenish', symptoms: ['none'] }] }), 'discharge');
    expect(a.ruleId).toBe('dis_color');
    expect(a.priority).toBe('followup');
  });
  it('fièvre : orientation rapide, pas seulement « surveiller »', () => {
    expect(only(base({ discharge: [{ id: 'e1', observed_at: '2026-10-12T09:00:00Z', color: 'yellowish', symptoms: ['fever', 'pelvic_pain'] }] }), 'discharge')[0].priority).toBe('prompt');
  });
  it('sang près de règles enregistrées : information ; sinon question de précision', () => {
    expect(only(base({ discharge: [{ id: 'e1', observed_at: '2026-09-26T09:00:00Z', color: 'brown', symptoms: [] }] }), 'discharge')[0].variant).toBe('near_period');
    const [b] = only(base({ discharge: [{ id: 'e1', observed_at: '2026-10-08T09:00:00Z', color: 'pink', symptoms: [] }] }), 'discharge');
    expect(b.variant).toBe('unexplained');
    expect(b.clarify).toBe('blood_context');
  });
});

describe('Test 9 — suppression d’un événement', () => {
  it('les conseils qui dépendaient de l’événement disparaissent', () => {
    const sex = [{ id: 'e1', occurred_on: '2026-10-18', condom: 'no', usual_contraception: 'no' }];
    expect(only(base({ sex }), 'sex')).toHaveLength(1);
    expect(only(base({ sex: [] }), 'sex')).toHaveLength(0);
  });
  it('un seul conseil par événement et par groupe (pas dix alertes)', () => {
    const list = only(base({ discharge: [{ id: 'e1', observed_at: '2026-10-12T09:00:00Z', color: 'greenish', odor: 'unpleasant', symptoms: ['itching', 'burning', 'urinary'] }] }), 'discharge');
    expect(list).toHaveLength(1);
    expect(list[0].triggers.length).toBeGreaterThan(2);
  });
});

describe('cycle : retard, absence, irrégularité', () => {
  it('retard : test évoqué sans conclure à une grossesse', () => {
    const input = base({ now: new Date('2026-10-27T10:00:00'), today: '2026-10-27' });
    const a = evaluateAdvice(input).find((x) => x.ruleId === 'cycle_late')!;
    expect(a.variant).toBe('unknown');
    expect(text('fr', 'adv.cycle_late.unknown.body')).toMatch(/Si une grossesse est possible/);
  });
  it('retard avec un rapport à la protection incertaine noté', () => {
    const input = base({ now: new Date('2026-10-27T10:00:00'), today: '2026-10-27', sex: [{ id: 's', occurred_on: '2026-10-03', condom: 'unsure' }] });
    expect(evaluateAdvice(input).find((x) => x.ruleId === 'cycle_late')!.variant).toBe('possible');
  });
  it('absence de 90 jours : consultation ; pas pendant une grossesse', () => {
    const input = base({ now: new Date('2026-12-25T10:00:00'), today: '2026-12-25' });
    expect(evaluateAdvice(input).some((x) => x.ruleId === 'cycle_absent')).toBe(true);
    expect(evaluateAdvice({ ...input, pregnant: true }).some((x) => x.ruleId === 'cycle_absent' || x.ruleId === 'cycle_late')).toBe(false);
  });
  it('peu de cycles : estimations annoncées comme peu fiables', () => {
    expect(evaluateAdvice(base({ periods: PERIODS.slice(2) })).some((x) => x.ruleId === 'cycle_irregular' && x.variant === 'insufficient')).toBe(true);
  });
});

describe('saignements inhabituels', () => {
  it('pendant une grossesse, abondant : urgence', () => {
    expect(only(base({ bleeding: [{ id: 'e1', occurred_on: '2026-10-18', kind: 'during_pregnancy', amount: 'heavy' }] }), 'bleeding')[0].priority).toBe('emergency');
  });
  it('après un rapport : consultation', () => {
    expect(only(base({ bleeding: [{ id: 'e1', occurred_on: '2026-10-18', kind: 'after_sex', amount: 'spotting' }] }), 'bleeding')[0].priority).toBe('consult');
  });
});

describe('règles : métadonnées, textes et sources', () => {
  it.each(ALL_RULES.map((r) => [r.id, r] as const))('%s : identifiant, sources, révision, garde-fous, textes FR/EN', (_id, r) => {
    expect(r.sources.length).toBeGreaterThan(0);
    for (const s of r.sources) expect(ADVICE_SOURCES[s]).toBeDefined();
    expect(r.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.guards.length).toBeGreaterThan(0);
    for (const v of r.variants) for (const part of ['title', 'body']) for (const lang of ['fr', 'en']) expect(text(lang, `adv.${r.id}.${v}.${part}`)).not.toBe('');
  });
  it('identifiants uniques', () => {
    const ids = ALL_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('chaque déclencheur produit par les scénarios a un libellé FR/EN', () => {
    const inputs: AdviceInput[] = [
      base({ sex: [{ id: 'a', occurred_on: '2026-10-18', condom: 'yes', condom_incident: 'slipped' }, { id: 'b', occurred_on: '2026-10-17', condom: 'no', usual_contraception: 'yes', contraception_incident: 'late' }, { id: 'c', occurred_on: '2026-10-16', usual_contraception: 'yes', contraception_incident: 'unsure', condom: 'no' }] }),
      base({ pain: [{ id: 'p', logged_on: '2026-10-18', pain_intensity: 4, pain_impact: ['studies', 'stopped', 'daily'] }, { id: 'q', logged_on: '2026-10-17', pain_intensity: 4, pain_associated: ['outside_period', 'painful_sex'] }] }),
      base({ discharge: [{ id: 'd', observed_at: '2026-10-12T09:00:00Z', color: 'greyish', odor: 'stronger', symptoms: ['irritation', 'pain'] }] }),
      base({ bleeding: ['between_periods', 'after_sex', 'pink_brown', 'unknown_origin', 'during_pregnancy'].map((k, i) => ({ id: `b${i}`, occurred_on: '2026-10-18', kind: k, amount: 'very_heavy', pain: true })) }),
    ];
    for (const input of inputs) for (const a of evaluateAdvice(input)) for (const t of a.triggers) for (const lang of ['fr', 'en']) expect([t.key, text(lang, `adv.trig.${t.key}`)]).not.toEqual([t.key, '']);
  });
  it('aucun texte ne pose de diagnostic ni ne prescrit de traitement', () => {
    const all = Object.entries(DICTIONARIES.fr).filter(([k]) => k.startsWith('adv.')).map(([, v]) => String(v)).join('\n');
    expect(all).not.toMatch(/\bvous avez (une|un) (mycose|infection|endométriose|kyste|IST)\b/i);
    expect(all).not.toMatch(/\b(prenez|appliquez|utilisez) (un |une )?(antifongique|antibiotique|ovule|crème)/i);
    expect(all).not.toMatch(/sans risque|aucun risque de grossesse|garanti(e)? (de ne pas|sans)/i);
  });
});

// ---------------------------------------------------------------- cas relevés par la relecture indépendante
describe('relecture : cas limites', () => {
  const sexToday = { id: 'e1', occurred_on: TODAY, condom: 'no', usual_contraception: 'no', pregnancy_wish: 'no' };
  it('rapport du jour sans heure : conseil affiché (jamais ignoré)', () => {
    const [a] = only(base({ sex: [sexToday] }), 'sex');
    expect(a.variant).toBe('h72');
  });
  it('limites exactes 72 h et 120 h', () => {
    const e = { ...sexToday, occurred_on: '2026-10-10', occurred_time: '10:00' };
    expect(only(base({ now: new Date('2026-10-13T10:00:00'), today: '2026-10-13', sex: [e] }), 'sex')[0].variant).toBe('h72');
    expect(only(base({ now: new Date('2026-10-13T10:01:00'), today: '2026-10-13', sex: [e] }), 'sex')[0].variant).toBe('h120');
    expect(only(base({ now: new Date('2026-10-15T10:01:00'), today: '2026-10-15', sex: [e] }), 'sex')[0].variant).toBe('passed');
  });
  it('grossesse en cours : pas d’alerte de contraception d’urgence', () => {
    expect(only(base({ pregnant: true, sex: [sexToday] }), 'sex')).toEqual([]);
  });
  it('préservatif rompu mais pilule bien prise : pas d’alerte ; contraception non précisée : alerte avec ce manque signalé', () => {
    expect(only(base({ sex: [{ id: 'e1', occurred_on: TODAY, condom: 'yes', condom_incident: 'broke', usual_contraception: 'yes', contraception_incident: 'none' }] }), 'sex')).toEqual([]);
    const [a] = only(base({ sex: [{ id: 'e1', occurred_on: TODAY, condom: 'yes', condom_incident: 'broke' }] }), 'sex');
    expect(a.ruleId).toBe('sex_risk');
    expect(a.triggers.map((t) => t.key)).toContain('contra_unknown');
  });
  it('rapport non vaginal : aucune alerte de grossesse', () => {
    expect(only(base({ sex: [{ ...sexToday, kind: 'other' }] }), 'sex')).toEqual([]);
  });
  it('contraception d’urgence « incertaine » : l’alerte reste affichée', () => {
    expect(only(base({ sex: [{ ...sexToday, ec_taken: 'unsure' }] }), 'sex')[0].ruleId).toBe('sex_risk');
  });
  it('grossesse en cours enregistrée : douleur + saignement → urgence ; pertes brunes + douleur → urgence ; saignement abondant → urgence', () => {
    expect(only(base({ pregnant: true, pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 4, pain_associated: ['unusual_bleeding'] }] }), 'pain')[0].priority).toBe('emergency');
    expect(only(base({ pregnant: true, discharge: [{ id: 'e1', observed_at: `${TODAY}T08:00:00Z`, color: 'brown', symptoms: ['pelvic_pain'] }] }), 'discharge')[0].priority).toBe('emergency');
    expect(only(base({ pregnant: true, bleeding: [{ id: 'e1', occurred_on: TODAY, kind: 'between_periods', amount: 'heavy' }] }), 'bleeding')[0].priority).toBe('emergency');
  });
  it('grossesse possible + douleur faible + malaise : urgence (pas de seuil d’intensité)', () => {
    const [a] = only(base({ pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 3, pain_pregnancy: 'possible', pain_associated: ['faint'] }] }), 'pain');
    expect(a.priority).toBe('emergency');
    expect(a.triggers.map((t) => t.key)).toContain('faint');
  });
  it('grossesse « je ne sais pas » + saignement : traité comme possible', () => {
    expect(only(base({ pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 4, pain_pregnancy: 'unknown', pain_associated: ['unusual_bleeding'] }] }), 'pain')[0].priority).toBe('emergency');
  });
  it('rapport à risque noté depuis les règles + douleur + saignement, grossesse non renseignée : urgence', () => {
    const input = base({ sex: [{ id: 's', occurred_on: '2026-10-01', condom: 'no', usual_contraception: 'no' }], pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 4, pain_associated: ['unusual_bleeding'] }] });
    expect(only(input, 'pain')[0].priority).toBe('emergency');
  });
  it('malaise ou vomissements avec une douleur modérée : avis rapide, jamais des pistes de confort', () => {
    for (const s of ['faint', 'vomiting']) {
      const [a] = only(base({ pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 5, pain_associated: [s] }] }), 'pain');
      expect([a.ruleId, a.priority]).toEqual(['pain_prompt', 'prompt']);
    }
  });
  it('pire que d’habitude et non soulagée, même sous 7 : avis rapide', () => {
    expect(only(base({ pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 5, pain_pattern: 'worse', pain_relief: 'not_helped' }] }), 'pain')[0].priority).toBe('prompt');
  });
  it('douleur forte habituelle, soulagement non renseigné : consultation (jamais rien)', () => {
    const [a] = only(base({ pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 9, pain_pattern: 'usual' }] }), 'pain');
    expect([a.ruleId, a.variant]).toEqual(['pain_consult', 'strong']);
  });
  it('fièvre (variante) et grossesse possible (variante) du conseil rapide', () => {
    expect(only(base({ pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 3, pain_associated: ['fever'] }] }), 'pain')[0].variant).toBe('fever');
    expect(only(base({ pain: [{ id: 'e1', logged_on: TODAY, pain_intensity: 3, pain_pregnancy: 'known' }] }), 'pain')[0].variant).toBe('pregnancy');
  });
  it('pertes : urgence sang + grossesse + douleur ; fièvre + sang + grossesse sans douleur : message grossesse (fièvre jointe)', () => {
    expect(only(base({ discharge: [{ id: 'e1', observed_at: `${TODAY}T08:00:00Z`, color: 'blood', symptoms: ['pain'], pregnancy: 'possible' }] }), 'discharge')[0].ruleId).toBe('dis_urgent');
    const [b] = only(base({ discharge: [{ id: 'e1', observed_at: `${TODAY}T08:00:00Z`, color: 'pink', symptoms: ['fever'], pregnancy: 'known' }] }), 'discharge');
    expect([b.ruleId, b.variant]).toEqual(['dis_blood', 'pregnancy']);
    expect(b.triggers.map((t) => t.key)).toContain('fever');
  });
  it('pertes blanches avec odeur plus forte : pas le message « sans odeur forte »', () => {
    expect(only(base({ discharge: [{ id: 'e1', observed_at: `${TODAY}T08:00:00Z`, color: 'white', odor: 'stronger', symptoms: [] }] }), 'discharge').map((a) => a.ruleId)).not.toContain('dis_info');
  });
  it('saignement très abondant hors grossesse : urgence ; traces + douleur : consultation', () => {
    expect(only(base({ bleeding: [{ id: 'e1', occurred_on: TODAY, kind: 'unknown_origin', amount: 'very_heavy' }] }), 'bleeding')[0].priority).toBe('emergency');
    expect(only(base({ bleeding: [{ id: 'e1', occurred_on: TODAY, kind: 'pink_brown', amount: 'spotting', pain: true }] }), 'bleeding')[0].priority).toBe('consult');
  });
  it('retard + rapport récent : le test n’est annoncé fiable qu’à 21 jours de ce rapport', () => {
    const input = base({ now: new Date('2026-10-27T10:00:00'), today: '2026-10-27', sex: [{ id: 's', occurred_on: '2026-10-25', condom: 'no', usual_contraception: 'no' }] });
    const a = evaluateAdvice(input).find((x) => x.ruleId === 'cycle_late')!;
    expect(a.variant).toBe('possible_recent');
    expect(a.params.date).toBe('2026-11-15');
  });
  it('retard dans la variabilité habituelle : pas de message', () => {
    expect(evaluateAdvice(base({ now: new Date('2026-10-22T10:00:00'), today: '2026-10-22' })).some((x) => x.ruleId === 'cycle_late')).toBe(false);
  });
  it('saisies de plus de 45 jours : plus de conseil', () => {
    expect(only(base({ pain: [{ id: 'e1', logged_on: '2026-08-01', pain_intensity: 9 }] }), 'pain')).toEqual([]);
  });
  it('anglais : aucun diagnostic, aucun traitement prescrit', () => {
    const all = Object.entries(DICTIONARIES.en).filter(([k]) => k.startsWith('adv.')).map(([, v]) => String(v)).join('\n');
    expect(all).not.toMatch(/\byou have (a |an )?(thrush|infection|STI|endometriosis|cyst)\b/i);
    expect(all).not.toMatch(/\b(take|apply|use) (an? )?(antifungal|antibiotic|pessary|cream)/i);
    expect(all).not.toMatch(/\b(safe day|no risk of pregnancy|guaranteed)\b/i);
  });
});
