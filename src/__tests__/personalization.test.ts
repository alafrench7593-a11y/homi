/**
 * Moteur de recommandation déterministe (src/lib/personalization) — profils fictifs A–G de la propriétaire,
 * garanties (épinglé, masqué, sensibles, nounou, autre adulte), recalcul automatique, métadonnées des outils,
 * réponses d'onboarding (v3, reprise des v2), onboarding en 6 étapes.
 */
import {
  buildFacts, childRecommendations, missingMeta, readJourneyAnswers, reasonText, recommend, toolMeta, toggleProfileTag,
  type Recommendation,
} from '@/lib/personalization';
import { CATEGORY_TOOLS, isToolAllowed, resolveTool } from '@/lib/journeys/tools';
import { HOMI_200 } from '@/lib/journeys/homi200';
import { factContexts } from '@/lib/personalization/facts';
import { asksFeeding, legacyAnswers, previewFacts } from '@/lib/onboarding/v3';
import { FEATURES } from '@/config/features';
import { NOW, persona } from './fixtures/personas';

const ids = (r: Recommendation[]) => r.map((x) => x.id);
const top10 = (k: string) => recommend(persona(k).facts, {}, { max: 10 });
const BABY_TOOLS = ['baby_bottle', 'baby_breastfeed', 'baby_diaper', 'baby_daily', 'bottle_scoops', 'baby_bottle_timer'];
const PREG_TOOLS = ['preg_evolution', 'preg_calendar', 'preg_feel', 'preg_weight', 'preg_moves', 'preg_lists'];
const SENSITIVE = (id: string) => !!toolMeta(id)?.sensitive;

describe('profils A–G', () => {
  it('A — femme enceinte : outils de grossesse en tête, aucun outil de bébé, raison avec la semaine', () => {
    const r = top10('A');
    expect(ids(r).slice(0, 3)).toEqual(['preg_evolution', 'preg_calendar', 'preg_feel']);
    expect(ids(r)).toEqual(expect.arrayContaining(['appointments']));
    expect(ids(r).filter((x) => PREG_TOOLS.includes(x)).length).toBeGreaterThanOrEqual(4);
    for (const b of BABY_TOOLS) expect(ids(r)).not.toContain(b);
    expect(reasonText(r[0].reason)).toBe('Parce que vous êtes enceinte (24 SA)');
  });

  it('B — bébé de 2 mois allaité : allaitement, sommeil, couches, récupération ; jamais le biberon de lait infantile', () => {
    const r = top10('B');
    expect(ids(r)).toEqual(expect.arrayContaining(['baby_breastfeed', 'kid_sleep', 'baby_diaper', 'pp_recovery']));
    expect(ids(r)).not.toContain('bottle_scoops');
    expect(ids(r)).not.toContain('baby_foods');
    for (const p of PREG_TOOLS) expect(ids(r)).not.toContain(p);
    expect(reasonText(r.find((x) => x.id === 'baby_breastfeed')!.reason)).toBe('Parce que vous allaitez');
    expect(reasonText(r.find((x) => x.id === 'kid_sleep')!.reason)).toBe('Parce que Lina a 2 mois');
  });

  it('C — papa co-parent d’un bébé de 8 mois : relais de nuit, sommeil, diversification proposée ; pas de post-partum de l’autre adulte', () => {
    const r = top10('C');
    expect(ids(r)).toEqual(expect.arrayContaining(['family_nights', 'kid_sleep', 'h200_111']));
    for (const x of ['pp_recovery', 'pp_checkin', 'h200_52', 'preg_feel', 'mood']) expect(ids(r)).not.toContain(x);
    expect(persona('C').facts.postpartum).toBe(false);
    expect(reasonText(r.find((x) => x.id === 'family_nights')!.reason)).toBe('Parce que vous êtes papa ou coparent');
  });

  it('D — enfant de 6 ans : école proposée, routines, responsabilités ; rien pour un bébé ni la grossesse', () => {
    const r = top10('D');
    expect(ids(r)).toEqual(expect.arrayContaining(['kid_school', 'kid_routines', 'h200_139']));
    for (const x of [...BABY_TOOLS, ...PREG_TOOLS, 'kid_teeth', 'h200_111', 'baby_foods']) expect(ids(r)).not.toContain(x);
    expect(reasonText(r.find((x) => x.id === 'h200_139')!.reason)).toBe('Parce que Noé a 6 ans');
  });

  it('E — nounou : SEULEMENT les outils de la garde ; aucun « Ton enfant » côté parent', () => {
    const r = top10('E');
    expect(r.length).toBeGreaterThan(3);
    for (const x of r) expect(resolveTool(x.id)!.def.id).toBe('childcare');
    expect(reasonText(r[0].reason)).toBe('Pour la garde de Lina');
    expect(childRecommendations(persona('E').facts, 'lina')).toEqual([]);
  });

  it('F — trois enfants : changer d’enfant adapte « Ton enfant »', () => {
    const f = persona('F').facts;
    const lea = ids(childRecommendations({ ...f, activeChildId: 'lea' }, 'lea'));
    const zoe = ids(childRecommendations({ ...f, activeChildId: 'zoe' }, 'zoe'));
    const tom = ids(childRecommendations({ ...f, activeChildId: 'tom' }, 'tom'));
    expect(lea).toEqual(expect.arrayContaining(['baby_bottle', 'kid_sleep', 'baby_diaper']));
    expect(zoe).toEqual(expect.arrayContaining(['kid_routines', 'h200_139', 'kid_school']));
    expect(tom).toEqual(expect.arrayContaining(['kid_school']));
    expect(zoe).not.toContain('baby_diaper');
    expect(lea).not.toContain('kid_routines');
    // chaque outil d'enfant s'ouvre sur le bon enfant
    for (const r of childRecommendations(f, 'zoe')) if (r.childId) expect(r.childId).toBe('zoe');
    // nounou associée → carnet de liaison
    expect(ids(top10('F'))).toEqual(expect.arrayContaining(['childcare', 'h200_153']));
  });

  it('G — sans informations : outils pour découvrir HOMI, aucun outil sensible ni d’enfant ; tout le catalogue reste explorable', () => {
    const r = top10('G');
    expect(r.length).toBe(10);
    for (const x of r) { expect(x.rule).toBe('discover'); expect(SENSITIVE(x.id)).toBe(false); }
    for (const x of [...BABY_TOOLS, ...PREG_TOOLS]) expect(ids(r)).not.toContain(x);
  });

  it('chaque recommandation est ouvrable pour ce foyer et porte une raison lisible', () => {
    for (const k of ['A', 'B', 'C', 'D', 'F', 'G']) {
      const f = persona(k).facts;
      const ctxs = factContexts(f);
      for (const r of recommend(f, {}, { max: 20 })) {
        expect(ctxs.some((c) => isToolAllowed(r.id, c))).toBe(true);
        const txt = reasonText(r.reason);
        expect(txt).toMatch(/^(Parce|Pour)/);
        expect(txt).not.toMatch(/\{|undefined|pz\./);
      }
    }
  });
});

describe('garanties', () => {
  const f = persona('B').facts;
  it('épinglé = toujours en tête ; masqué = jamais recommandé', () => {
    const r = recommend(f, { pinned: ['library'], hidden: ['baby_breastfeed'] });
    expect(r[0]).toMatchObject({ id: 'library', pinned: true });
    expect(ids(r)).not.toContain('baby_breastfeed');
    // un ancien identifiant épinglé est résolu
    expect(recommend(f, { pinned: ['pp_feeding'] })[0].id).toBe('baby_breastfeed');
  });
  it('données sensibles : jamais sans choix de la personne (cycle, fertilité, contraception, santé mentale)', () => {
    for (const k of ['A', 'B', 'C', 'D', 'F', 'G']) for (const r of recommend(persona(k).facts, {}, { max: 30 })) expect(SENSITIVE(r.id)).toBe(false);
    const ttc = buildFacts({ now: NOW, myJourneys: ['ttc'] });
    expect(ids(recommend(ttc))).toEqual(expect.arrayContaining(['ttc_cycle', 'h200_17']));
    const avoid = buildFacts({ now: NOW, myJourneys: ['avoid'] });
    expect(ids(recommend(avoid))).toContain('avoid_contraception');
  });
  it('jamais les données de l’autre adulte : une grossesse partagée ne pousse pas le suivi du corps', () => {
    const shared = buildFacts({ now: NOW, role: 'coparent', pregnancy: { id: 'p', mine: false, weeks: 30 }, answers: { v: 3, profile: ['dad'] } });
    const r = ids(recommend(shared));
    expect(r).toContain('preg_evolution');
    for (const x of ['preg_weight', 'preg_feel', 'preg_moves']) expect(r).not.toContain(x);
  });
  it('l’assistant éteint et les numéros absents ne sont jamais proposés', () => {
    const was = FEATURES.aiAssistantOnline;
    FEATURES.aiAssistantOnline = false;
    try {
      expect(toolMeta('ask')!.isAvailable).toBe(false);
      for (const k of ['A', 'B', 'G']) expect(ids(recommend(persona(k).facts, { pinned: ['ask'] }, { max: 40 }))).not.toContain('ask');
    } finally { FEATURES.aiAssistantOnline = was; }
  });
});

describe('recalcul automatique', () => {
  const at = (iso: string) => new Date(`${iso}T09:00:00`);
  const kid = [{ id: 'k', first_name: 'Lina', birth_date: '2026-01-15' }];
  const rec = (now: Date, extra = {}) => ids(recommend(buildFacts({ now, myJourneys: ['baby'], children: kid, ...extra }), {}, { max: 12 }));
  it('nouvelle grossesse → outils grossesse', () => {
    expect(ids(recommend(buildFacts({ now: NOW, myJourneys: ['pregnancy'], pregnancy: { mine: true, weeks: 10 } })))).toContain('preg_evolution');
  });
  it('naissance enregistrée → outils du nouveau-né (la grossesse n’est plus active)', () => {
    const r = rec(at('2026-02-01'));
    expect(r).toEqual(expect.arrayContaining(['kid_sleep', 'baby_diaper']));
    expect(r).not.toContain('preg_evolution');
  });
  it('l’âge avance : 0–6 m → 6–12 m (diversification proposée) → 1–3 a → … ; diversification commencée → alimentation', () => {
    expect(rec(at('2026-03-01'))).toContain('baby_diaper');
    expect(rec(at('2026-09-01'))).toContain('h200_111');
    expect(rec(at('2026-09-01'), { foodsStarted: ['k'] })).toContain('baby_foods');
    expect(rec(at('2027-06-01'))).toContain('kid_grow');
    expect(rec(at('2029-06-01'))).toContain('kid_school'); // âge scolaire : proposé, sans présumer de l'inscription
    expect(rec(at('2032-06-01'))).toContain('h200_139');
  });
  it('nounou associée → carnet de liaison et photos', () => {
    expect(rec(at('2026-09-01'), { caregiverLinked: true })).toEqual(expect.arrayContaining(['childcare', 'h200_153']));
    // garde en place : planning, heures, absences
    const linked = ids(childRecommendations(buildFacts({ now: at('2026-09-01'), myJourneys: ['baby'], children: kid, caregiverLinked: true }), 'k', {}, 16));
    expect(linked).toEqual(expect.arrayContaining(['h200_148', 'h200_149', 'h200_150']));
  });
  it('« Trouver une nounou » → avant la garde (141–147) ; la nounou elle-même → seulement 149 et 150 parmi eux', () => {
    const f = buildFacts({ now: NOW, myJourneys: ['baby'], children: kid, answers: { v: 3, profile: ['new_baby'], priorities: ['find_nanny'] } });
    const r = ids(recommend(f, {}, { max: 20 }));
    expect(r).toEqual(expect.arrayContaining(['h200_141', 'h200_142', 'h200_144', 'h200_146']));
    const nanny = ids(recommend(persona('E').facts, {}, { max: 20 }));
    expect(nanny).toEqual(expect.arrayContaining(['h200_149', 'h200_150']));
    for (const n of [141, 142, 143, 144, 145, 146, 147, 148, 151]) expect(nanny).not.toContain(`h200_${n}`);
  });
});

describe('métadonnées et réponses', () => {
  it('chaque outil du registre a ses métadonnées ; les outils d’enfant ont une tranche d’âge ; IA « aucun » par défaut', () => {
    expect(missingMeta()).toEqual([]);
    for (const d of CATEGORY_TOOLS) {
      const m = toolMeta(d.id)!;
      expect(m.lifeStages.length).toBeGreaterThan(0);
      if (m.requiredData?.includes('child')) expect(m.ageRange).toBeDefined();
    }
    expect(CATEGORY_TOOLS.filter((d) => toolMeta(d.id)!.aiMode !== 'none').map((d) => d.id).sort()).toEqual(['ask', 'local_ai']);
    for (const e of HOMI_200.filter((x) => x.kind === 'view')) expect(toolMeta(e.id)).not.toBeNull();
  });
  it('réponses v3 nettoyées ; réponses v2 reprises sans refaire l’onboarding', () => {
    expect(readJourneyAnswers({ v: 3, profile: ['dad', 'x'], household: 'solo', feeding: 'breast', priorities: ['sleep', 'nope'] }))
      .toEqual({ profile: ['dad'], household: 'solo', invite: false, feeding: 'breast', priorities: ['sleep'] });
    expect(readJourneyAnswers({ v: 2, situations: ['baby', 'kids'], needs: ['sleep', 'mental_load'], sharing: 'couple' }))
      .toEqual({ profile: ['new_baby', 'kids'], household: 'partner', invite: false, feeding: null, priorities: ['sleep', 'tasks'] });
    expect(readJourneyAnswers(null)).toBeNull();
    expect(toggleProfileTag(['ttc'], 'discover')).toEqual(['discover']);
    expect(toggleProfileTag(['discover'], 'kids')).toEqual(['kids']);
  });
  it('onboarding 6 étapes : alimentation demandée seulement pour un nourrisson ; parcours v2 conservés ; aperçu par le moteur réel', () => {
    const a = { profile: ['kids' as const], household: null, invite: false, feeding: null, priorities: [] };
    expect(asksFeeding(a, [{ first_name: 'Noé', birth_date: '01/09/2020', sex: null, tracking: [], allergies: '' }], '2026-11-20')).toBe(false);
    expect(asksFeeding(a, [{ first_name: 'Lina', birth_date: '01/09/2026', sex: null, tracking: [], allergies: '' }], '2026-11-20')).toBe(true);
    expect(legacyAnswers({ profile: ['pregnant', 'ttc'], household: 'separated', invite: true, feeding: null, priorities: ['sleep'] }))
      .toMatchObject({ situations: ['ttc', 'pregnant'], sharing: 'coparenting', needs: ['sleep'] });
    const pf = previewFacts({ profile: ['new_baby'], household: 'partner', invite: false, feeding: 'breast', priorities: [] }, [{ first_name: 'Lina', birth_date: '14/09/2026', sex: null, tracking: [], allergies: '' }], null, NOW);
    expect(ids(recommend(pf))).toContain('baby_breastfeed');
  });
});
