/**
 * Onboarding v2 : synthèse personnalisée (logique pure, src/lib/onboarding/personalize.ts).
 * Les outils recommandés et la première action sont de VRAIES routes de l'application, ouvertes aux parcours choisis.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { APP_ROUTES } from '@/lib/routes.generated';
import { screenAllowed, toolLabelKey } from '@/lib/journeys/tools';
import { tMaybe } from '@/i18n';
import { FEATURES } from '@/lib/premium/features';
import { restoreDraft, serializeDraft, type OnboardingDraft } from '@/lib/onboardingDraft';
import {
  answersPayload, emptyAnswers, firstAction, journeysFor, MAX_NEEDS, NEEDS, personalize, premiumHighlights, primarySituation,
  priorityNeed, recommendTools, sanitizeAnswers, scopesFor, SITUATIONS, situationsFromJourneys, splitCounts, splitDeck,
  toggleNeed, toggleSituation, assignees, interestsFor, type OnboardingAnswers, type Situation,
} from '@/lib/onboarding/personalize';

const A = (o: Partial<OnboardingAnswers>): OnboardingAnswers => ({ ...emptyAnswers(), ...o });

/** Une adresse existe si elle correspond à une route générée (segments dynamiques compris, groupes retirés). */
function routeExists(href: string): boolean {
  const path = href.split('?')[0].replace(/\/\([^)]+\)/g, '') || '/';
  return APP_ROUTES.some((r) => {
    const re = new RegExp(`^${r.replace(/\[[^\]]+\]/g, '[^/]+')}$`);
    return re.test(path);
  });
}

describe('situation et parcours', () => {
  it('un seul suivi du corps à la fois (projet bébé, grossesse, cycle)', () => {
    let s: Situation[] = [];
    s = toggleSituation(s, 'ttc');
    s = toggleSituation(s, 'baby');
    s = toggleSituation(s, 'pregnant');
    expect(s).toEqual(['baby', 'pregnant']);
    s = toggleSituation(s, 'cycle');
    expect(s).toEqual(['baby', 'cycle']);
    expect(toggleSituation(s, 'baby')).toEqual(['cycle']);
  });
  it('les parcours activés suivent les réponses', () => {
    expect(journeysFor(A({ situations: ['pregnant', 'kids'] }))).toEqual(['pregnant', 'family']);
    expect(journeysFor(A({ situations: ['cycle'], cycleGoal: 'avoid' }))).toEqual(['avoid']);
    expect(journeysFor(A({ situations: ['baby', 'home'] }))).toEqual(['newborn']);
    expect(journeysFor(A({ situations: ['home'] }))).toEqual([]);
  });
  it('ancien brouillon (parcours seuls) → situations', () => {
    expect(situationsFromJourneys(['avoid', 'newborn'])).toEqual({ situations: ['cycle', 'baby'], cycleGoal: 'avoid' });
    expect(journeysFor(situationsFromJourneys(['ttc', 'family']))).toEqual(['ttc', 'family']);
  });
  it('besoins : deux au plus, le plus ancien cède sa place', () => {
    let n = toggleNeed([], 'sleep');
    n = toggleNeed(n, 'meals');
    n = toggleNeed(n, 'mental_load');
    expect(n).toEqual(['meals', 'mental_load']);
    expect(n.length).toBe(MAX_NEEDS);
    expect(toggleNeed(n, 'meals')).toEqual(['mental_load']);
  });
  it('centres d’intérêt du profil déduits des besoins', () => {
    expect(interestsFor(A({ needs: ['community', 'sleep'] }))).toEqual(['community']);
    expect(interestsFor(A({ needs: ['health'] }))).toEqual(['health']);
  });
});

describe('synthèse calculée', () => {
  const cases: OnboardingAnswers[] = [];
  for (const s of SITUATIONS) for (const n of [[], ...NEEDS.map((x) => [x])]) for (const sharing of ['solo', 'couple', null] as const) {
    cases.push(A({ situations: [s], needs: n as OnboardingAnswers['needs'], sharing }));
  }
  cases.push(A({ situations: ['pregnant', 'kids'], needs: ['meals', 'sleep'], sharing: 'coparenting', helpers: ['daycare'] }));
  cases.push(A({ situations: [], needs: [] }));

  it.each(cases.map((c) => [JSON.stringify(c), c]))('%s : 3 outils réels, distincts, autorisés, et une première action ouverte', (_k, a) => {
    const p = personalize(a as OnboardingAnswers);
    const scopes = scopesFor(a as OnboardingAnswers);
    expect(p.tools).toHaveLength(3);
    expect(new Set(p.tools.map((x) => x.id)).size).toBe(3);
    expect(new Set(p.tools.map((x) => x.route)).size).toBe(3);
    for (const t of p.tools) {
      expect(routeExists(t.route)).toBe(true);
      expect(screenAllowed(t.route.split('?')[0], scopes)).toBe(true);
      // libellé réel de l'outil (clé de traduction existante)
      expect(tMaybe(toolLabelKey(t.id))).toBeTruthy();
    }
    expect(routeExists(p.first.route)).toBe(true);
    expect(screenAllowed(p.first.route, scopes)).toBe(true);
    expect(p.premium.length).toBeGreaterThanOrEqual(2);
    for (const f of p.premium) expect(FEATURES[f]).toBeDefined();
  });

  it('besoin prioritaire : celui choisi, sinon déduit de la situation', () => {
    expect(priorityNeed(A({ situations: ['baby'], needs: ['meals'] }))).toBe('meals');
    expect(priorityNeed(A({ situations: ['baby'] }))).toBe('sleep');
    expect(priorityNeed(A({ situations: ['pregnant'] }))).toBe('appointments');
  });
  it('situation principale : bébé avant grossesse avant enfants', () => {
    expect(primarySituation(A({ situations: ['kids', 'pregnant'] }))).toBe('pregnant');
    expect(primarySituation(A({ situations: ['kids', 'baby'] }))).toBe('baby');
    expect(primarySituation(A({ situations: [] }))).toBe('home');
  });
  it('chaque besoin choisi est servi par un outil', () => {
    const tools = recommendTools(A({ situations: ['baby'], needs: ['meals', 'mental_load'] })).map((x) => x.id);
    expect(tools).toContain('family_shopping');
    expect(tools).toContain('mental_load');
  });
  it('jamais un outil de grossesse ou de biberon hors de ces parcours', () => {
    const ids = recommendTools(A({ situations: ['home'], needs: ['health', 'sleep'] })).map((x) => x.id);
    expect(ids.some((x) => x.startsWith('preg_') || x.startsWith('baby_') || x === 'kid_sleep')).toBe(false);
  });
  it('première action : selon le besoin et le foyer', () => {
    expect(firstAction(A({ situations: ['kids'], needs: ['mental_load'], sharing: 'couple' })).key).toBe('mission');
    expect(firstAction(A({ situations: ['kids'], needs: ['mental_load'], sharing: 'solo' })).key).toBe('brain_dump');
    expect(firstAction(A({ situations: ['baby'] }))).toEqual({ key: 'night', route: '/night' });
    expect(firstAction(A({ situations: ['baby'], needs: ['health'] }))).toEqual({ key: 'bottle', route: '/bottle' });
    expect(firstAction(A({ situations: ['pregnant'], needs: ['health'] })).key).toBe('week');
    expect(firstAction(A({ situations: ['home'], needs: ['meals'] })).key).toBe('shopping');
  });
  it('Premium : partage avec le coparent proposé seulement si le foyer est partagé ; rien sur l’enfant sans enfant', () => {
    expect(premiumHighlights(A({ situations: ['kids'], sharing: 'couple' }))).toContain('coparent_invite');
    expect(premiumHighlights(A({ situations: ['kids'], sharing: 'solo' }))).not.toContain('coparent_invite');
    const ttc = premiumHighlights(A({ situations: ['ttc'], needs: ['sleep', 'mental_load'] }));
    expect(ttc).not.toContain('sleep_insights');
    expect(ttc).not.toContain('family_summary');
  });
});

describe('répartition des tâches', () => {
  it('3 à 4 cartes, liées à la situation et aux aides', () => {
    const d = splitDeck(A({ situations: ['baby'], helpers: ['daycare'] }));
    expect(d.length).toBeGreaterThanOrEqual(3);
    expect(d.length).toBeLessThanOrEqual(4);
    expect(d[0]).toBe('night');
    expect(d).toContain('daycare');
    expect(splitDeck(A({ situations: ['pregnant'] }))).toContain('bag');
    expect(splitDeck(A({ situations: ['home'] }))).not.toContain('night');
  });
  it('seul·e : « moi » et « plus tard » ; à deux : « moi » et l’autre parent', () => {
    expect(assignees({ sharing: 'solo', helpers: [] })).toEqual({ left: 'me', right: 'later' });
    expect(assignees({ sharing: 'couple', helpers: [] })).toEqual({ left: 'me', right: 'other' });
    expect(splitCounts({ appt: 'me', night: 'other', shopping: 'me' })).toEqual({ me: 2, other: 1, later: 0 });
  });
});

describe('enregistrement', () => {
  it('réponses nettoyées (valeurs inconnues retirées, deux besoins au plus)', () => {
    const s = sanitizeAnswers({ situations: ['baby', 'x', 'baby'], needs: ['sleep', 'meals', 'health'], sharing: 'bof', helpers: ['nanny', 'robot'], split: { appt: 'me', hack: 'me', night: 'nope' }, cycleGoal: 'avoid' });
    expect(s).toEqual({ situations: ['baby'], cycleGoal: 'avoid', needs: ['sleep', 'meals'], sharing: null, helpers: ['nanny'], split: { appt: 'me' } });
    expect(sanitizeAnswers(null)).toEqual(emptyAnswers());
  });
  it('charge utile bornée, sans prénom ni date de naissance', () => {
    const a = A({ situations: ['baby', 'cycle'], cycleGoal: 'avoid', needs: ['sleep'], sharing: 'couple', split: { night: 'other' } });
    const payload = answersPayload(a, personalize(a), new Date('2026-11-19T10:00:00Z'));
    expect(payload.v).toBe(2);
    expect(payload.cycle_goal).toBe('avoid');
    expect(payload.recommendations.tools).toHaveLength(3);
    expect(payload.completed_at).toBe('2026-11-19T10:00:00.000Z');
    const json = JSON.stringify(payload);
    expect(json.length).toBeLessThan(2000);
    expect(json).not.toMatch(/first_name|birth|due_date/);
  });
});

describe('brouillon v2 (reprise après interruption)', () => {
  const base: OnboardingDraft = {
    v: 1, step: 'split', name: 'Camille', journeys: ['newborn'], pregnancy: { due_date: '' } as never, children: [], reminders: [],
    consents: { terms: true, health_data: true, ai_assistant: false, document_reading: false, analytics: false, crash_reports: false, marketing: false }, bottleFeeding: null, interests: [],
  };
  it('réponses et nouvelles étapes conservées', () => {
    const d: OnboardingDraft = { ...base, answers: A({ situations: ['baby'], needs: ['sleep'], sharing: 'couple', split: { night: 'other' } }) };
    expect(restoreDraft(serializeDraft(d))).toEqual(d);
    expect(restoreDraft(JSON.stringify({ ...d, step: 'household' }))?.step).toBe('household');
  });
  it('réponses d’un brouillon altéré nettoyées', () => {
    const r = restoreDraft(JSON.stringify({ ...base, answers: { situations: ['baby', 'pirate'], needs: 'x', split: { night: 'evil' } } }));
    expect(r?.answers).toEqual({ ...emptyAnswers(), situations: ['baby'] });
  });
});
