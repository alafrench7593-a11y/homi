/**
 * Refonte de la navigation (17/11/2026) — logique pure : action rapide centrale, sélecteur de profil universel,
 * configurations déclaratives de l'accueil, journée filtrée par profil.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { DICTIONARIES } from '@/i18n/dictionaries';
import { APP_ROUTES } from '@/lib/routes.generated';
import { QUICK_ACTIONS, QUICK_ALLOWED, QUICK_MAX, QUICK_MIN, quickAvailable, quickHref, quickProfile, quickShown, type QuickProfile } from '@/features/quickActions/quickActions';
import { activeProfileIndex, neighbourIndex, profileEntries, swipeDirection } from '@/components/profileList';
import { defaultHomeLayout, HOME_MODULE_KEYS, HOME_MODULES, HOME_PRESETS, HOME_SITUATIONS, homeSituation, moveModule, resolveHomeLayout, setModuleVisible, shownModules } from '@/features/homeToday/homeLayout';
import { appointmentForProfile, custodyForProfile, eventForProfile, shiftForProfile, taskForProfile, type TodayProfile } from '@/features/homeToday/todayModel';

const PROFILES = Object.keys(QUICK_ALLOWED) as QuickProfile[];

describe('Action rapide centrale', () => {
  it.each(PROFILES.map((p) => [p]))('« %s » : 4 à 6 actions par défaut, toutes permises pour le profil', (p) => {
    const shown = quickShown({ profile: p });
    expect(shown.length).toBeGreaterThanOrEqual(QUICK_MIN);
    expect(shown.length).toBeLessThanOrEqual(QUICK_MAX);
    for (const k of shown) expect(QUICK_ALLOWED[p]).toContain(k);
    expect(new Set(shown).size).toBe(shown.length);
  });

  it('cahier des charges : biberon, tétée, sieste, tâche, rendez-vous, observation pour un bébé', () => {
    expect(quickShown({ profile: 'baby' })).toEqual(['bottle', 'breastfeed', 'nap', 'observation', 'task', 'appointment']);
    // tâche et rendez-vous disponibles pour TOUS les profils (avant : la tâche seulement sur l'accueil, pas de rendez-vous)
    for (const p of PROFILES) { expect(quickShown({ profile: p })).toContain('task'); expect(quickAvailable({ profile: p })).toContain('appointment'); }
    // jamais un biberon ni une sieste pour une grossesse, un cycle ou « moi »
    for (const p of ['pregnancy', 'cycle', 'me', 'family', 'postpartum'] as QuickProfile[]) for (const k of ['bottle', 'breastfeed', 'diaper', 'nap']) expect(QUICK_ALLOWED[p]).not.toContain(k);
  });

  it('« sieste » ouvre la SAISIE de sommeil de l’enfant, pas l’écran Nuit ; chaque action mène à une route qui existe', () => {
    expect(quickHref('nap', { childId: 'c1' })).toBe('/track/sleep?child=c1');
    expect(quickHref('nap', { childId: 'c1' })).not.toContain('/night');
    expect(quickHref('appointment', { childId: 'c1' })).toBe('/appointments?new=quick&child=c1');
    expect(quickHref('appointment', { pregnancy: true })).toBe('/appointments?new=quick&concern=pregnancy');
    expect(quickHref('task', {})).toBeNull();
    for (const k of Object.keys(QUICK_ACTIONS) as (keyof typeof QUICK_ACTIONS)[]) {
      const href = quickHref(k, { childId: 'c1' });
      if (!href) continue;
      const pathname = href.split('?')[0];
      const ok = APP_ROUTES.includes(pathname) || APP_ROUTES.some((r) => r.includes('[') && new RegExp(`^${r.replace(/\[[^\]]+\]/g, '[^/]+')}$`).test(pathname));
      expect([k, pathname, ok]).toEqual([k, pathname, true]);
    }
  });

  it('choix de la personne : ordre conservé, actions interdites retirées, complété jusqu’à 4, plafonné à 6', () => {
    expect(quickShown({ profile: 'baby' }, ['diaper', 'bottle', 'task', 'nap'])).toEqual(['diaper', 'bottle', 'task', 'nap']);
    // une action d'un autre profil (poids de grossesse) est ignorée, puis la liste est complétée par les défauts
    expect(quickShown({ profile: 'baby' }, ['weight', 'diaper'])).toEqual(['diaper', 'bottle', 'breastfeed', 'nap']);
    expect(quickShown({ profile: 'baby' }, ['bottle', 'breastfeed', 'nap', 'observation', 'task', 'appointment', 'diaper', 'meal'])).toHaveLength(QUICK_MAX);
    expect(quickShown({ profile: 'pregnancy', hideWeight: true })).not.toContain('weight');
    expect(quickAvailable({ profile: 'baby', postpartum: true })).toContain('checkin');
    expect(quickProfile('ttc')).toBe('cycle');
    expect(quickProfile('none')).toBe('me');
    expect(quickProfile('baby')).toBe('baby');
  });

  it.each(Object.keys(DICTIONARIES).map((l) => [l]))('« %s » : libellés explicites (verbe + objet) pour chaque action', (locale) => {
    for (const a of Object.values(QUICK_ACTIONS)) {
      const label = DICTIONARIES[locale][a.label] as string;
      expect([a.key, typeof label === 'string' && label.trim().split(/\s+/).length >= 2]).toEqual([a.key, true]);
    }
    expect((DICTIONARIES[locale]['qa.buttonA11y'] as string).length).toBeGreaterThan(2);
  });
});

describe('Sélecteur de profil universel', () => {
  const kids = [{ id: 'c1', first_name: 'Léa', photo_path: null, birth_date: '2026-06-01' }, { id: 'c2', first_name: 'Tom', photo_path: null, birth_date: '2023-01-01' }];

  it('ordre : Moi, grossesse, chaque enfant, puis la famille (à partir de deux profils)', () => {
    expect(profileEntries({ pregnancyId: 'p1', children: kids }).map((e) => e.key)).toEqual(['me', 'preg', 'c1', 'c2', 'family']);
    expect(profileEntries({ children: [kids[0]] }).map((e) => e.key)).toEqual(['me', 'c1']);
    expect(profileEntries({ pregnancyId: 'p1', children: [] }).map((e) => e.key)).toEqual(['me', 'preg']);
  });

  it('permissions : un profil que le serveur ne renvoie pas n’apparaît jamais (nounou sans périmètre, grossesse fermée)', () => {
    // nounou : aucun enfant autorisé, grossesse fermée → il ne reste que « Moi »
    expect(profileEntries({ pregnancyId: null, children: [] }).map((e) => e.key)).toEqual(['me']);
    expect(profileEntries({ pregnancyId: undefined, children: undefined }).map((e) => e.key)).toEqual(['me']);
    // périmètre par enfant : seul l'enfant autorisé, pas de « Toute la famille » avec un seul profil
    const one = profileEntries({ children: [kids[1]] });
    expect(one.map((e) => e.key)).toEqual(['me', 'c2']);
    expect(one.some((e) => e.kind === 'family' || e.kind === 'pregnancy')).toBe(false);
  });

  it('profil affiché et voisins : un choix devenu invalide retombe sur le premier, le glissement ne boucle pas', () => {
    const list = profileEntries({ pregnancyId: 'p1', children: kids });
    expect(activeProfileIndex(list, { type: 'child', id: 'c2' })).toBe(3);
    expect(activeProfileIndex(list, { type: 'pregnancy', id: 'p1' })).toBe(1);
    expect(activeProfileIndex(list, { type: 'family' })).toBe(4);
    expect(activeProfileIndex(list, { type: 'child', id: 'retiré' })).toBe(0);
    expect(activeProfileIndex(list, { type: 'postpartum' })).toBe(0);
    expect(neighbourIndex(5, 2, 1)).toBe(3);
    expect(neighbourIndex(5, 2, -1)).toBe(1);
    expect(neighbourIndex(5, 4, 1)).toBe(4);
    expect(neighbourIndex(5, 0, -1)).toBe(0);
    expect(neighbourIndex(1, 0, 1)).toBe(0);
  });

  it('geste : vers la gauche = profil suivant, vers la droite = précédent ; un petit geste ne change rien', () => {
    expect(swipeDirection(-80, 0)).toBe(1);
    expect(swipeDirection(80, 0)).toBe(-1);
    expect(swipeDirection(-20, -100)).toBe(0);
    expect(swipeDirection(40, 900)).toBe(-1);
    expect(swipeDirection(-10, -2000)).toBe(0);
  });
});

describe('Accueil : configurations déclaratives par situation', () => {
  it('situation : profil affiché d’abord ; couple = deux adultes sans enfant ni grossesse', () => {
    expect(homeSituation({ scope: 'pregnancy', adults: 2, children: 0, pregnancy: true })).toBe('pregnancy');
    expect(homeSituation({ scope: 'baby', adults: 2, children: 1, pregnancy: false })).toBe('newborn');
    expect(homeSituation({ scope: 'postpartum', adults: 1, children: 1, pregnancy: false })).toBe('newborn');
    expect(homeSituation({ scope: 'child', adults: 2, children: 2, pregnancy: false })).toBe('child');
    expect(homeSituation({ scope: 'family', adults: 2, children: 2, pregnancy: false })).toBe('family');
    expect(homeSituation({ scope: 'none', adults: 2, children: 0, pregnancy: false })).toBe('couple');
    expect(homeSituation({ scope: 'cycle', adults: 2, children: 0, pregnancy: false })).toBe('couple');
    // « Moi » dans un foyer avec enfant ou grossesse, ou seule : pas un couple
    expect(homeSituation({ scope: 'cycle', adults: 2, children: 1, pregnancy: false })).toBe('cycle');
    expect(homeSituation({ scope: 'none', adults: 2, children: 0, pregnancy: true })).toBe('me');
    expect(homeSituation({ scope: 'ttc', adults: 1, children: 0, pregnancy: false })).toBe('cycle');
    expect(homeSituation({ scope: 'none', adults: 1, children: 0, pregnancy: false })).toBe('me');
  });

  it.each(HOME_SITUATIONS.map((s) => [s]))('« %s » : prochaine action en tête, modules connus et sans doublon, ordre de référence respecté', (s) => {
    const shown = HOME_PRESETS[s];
    expect(shown[0]).toBe('next');
    expect(new Set(shown).size).toBe(shown.length);
    for (const k of shown) expect(HOME_MODULE_KEYS).toContain(k);
    // ordre du cahier des charges : prochaine action < résumé du profil < agenda < articles
    const at = (k: string) => shown.indexOf(k as never);
    expect(at('main')).toBeGreaterThan(at('next'));
    expect(at('agenda')).toBeGreaterThan(at('main'));
    expect(at('articles')).toBeGreaterThan(at('agenda'));
    if (at('quick') >= 0) expect(at('quick')).toBeLessThan(at('main'));
    if (at('recommendation') >= 0) { expect(at('recommendation')).toBeGreaterThan(at('agenda')); expect(at('recommendation')).toBeLessThan(at('articles')); }
    // la configuration complète contient tous les modules, les autres masqués
    const def = defaultHomeLayout(s);
    expect([...def.order].sort()).toEqual([...HOME_MODULE_KEYS].sort());
    expect(shownModules(def)).toEqual(shown);
  });

  it('le couple affiche les tâches du foyer (la famille les a déjà dans son agenda) ; les 5 situations demandées existent', () => {
    for (const s of ['pregnancy', 'newborn', 'child', 'couple', 'family'] as const) expect(HOME_PRESETS[s].length).toBeGreaterThanOrEqual(5);
    expect(HOME_PRESETS.couple).toContain('familyTasks');
    expect(HOME_PRESETS.family).not.toContain('familyTasks');
    expect(HOME_PRESETS.pregnancy).not.toContain('familyTasks');
  });

  it('personnalisation : réordonner, masquer, afficher, rétablir ; un module ajouté depuis prend sa place par défaut', () => {
    const def = defaultHomeLayout('family');
    const moved = moveModule(def, 'agenda', -1);
    expect(shownModules(moved).indexOf('agenda')).toBe(shownModules(def).indexOf('agenda') - 1);
    expect(moveModule(def, 'next', -1)).toBe(def);
    const hidden = setModuleVisible(moved, 'quick', false);
    expect(shownModules(hidden)).not.toContain('quick');
    const pinned = setModuleVisible(hidden, 'tools', true);
    expect(shownModules(pinned)).toContain('tools');
    // enregistré puis relu : identique ; rien d'enregistré (rétabli) : la configuration par défaut
    expect(resolveHomeLayout('family', pinned)).toEqual(pinned);
    expect(resolveHomeLayout('family', null)).toEqual(def);
    expect(resolveHomeLayout('family', { order: [], hidden: [] })).toEqual(def);
    // ancienne configuration (module inconnu, modules manquants) : nettoyée et complétée, sans afficher par surprise
    const old = resolveHomeLayout('family', { order: ['main', 'ancien', 'next'], hidden: [] });
    expect([...old.order].sort()).toEqual([...HOME_MODULE_KEYS].sort());
    expect(old.order).not.toContain('ancien');
    expect(shownModules(old)).toEqual(expect.arrayContaining(['main', 'next', 'agenda']));
    expect(shownModules(old)).not.toContain('videos');
  });

  it.each(Object.keys(DICTIONARIES).map((l) => [l]))('« %s » : chaque module et chaque situation a un libellé', (locale) => {
    for (const m of HOME_MODULES) expect([m.key, typeof DICTIONARIES[locale][m.label]]).toEqual([m.key, 'string']);
    for (const s of HOME_SITUATIONS) expect(typeof DICTIONARIES[locale][`hm.situation.${s}`]).toBe('string');
  });
});

describe('Journée et agenda du jour filtrés par profil', () => {
  const lea: TodayProfile = { kind: 'child', childId: 'c1' };
  const preg: TodayProfile = { kind: 'pregnancy', pregnancyId: 'p1' };
  const me: TodayProfile = { kind: 'me', userId: 'u1' };
  const all: TodayProfile = { kind: 'all' };

  it('événements : ceux de l’enfant affiché et ceux de toute la famille ; jamais ceux d’un autre enfant', () => {
    expect(eventForProfile({ child_id: 'c1' }, lea)).toBe(true);
    expect(eventForProfile({ child_id: null }, lea)).toBe(true);
    expect(eventForProfile({ child_id: 'c2' }, lea)).toBe(false);
    expect(eventForProfile({ child_id: 'c2' }, me)).toBe(false);
    expect(eventForProfile({ child_id: null }, preg)).toBe(true);
    expect(eventForProfile({ child_id: 'c2' }, all)).toBe(true);
  });

  it('rendez-vous : enfant → les siens ; grossesse → les miens et ceux de la grossesse ; moi → les miens', () => {
    expect(appointmentForProfile({ child_id: 'c1', pregnancy_id: null }, lea)).toBe(true);
    expect(appointmentForProfile({ child_id: 'c2', pregnancy_id: null }, lea)).toBe(false);
    expect(appointmentForProfile({ child_id: null, pregnancy_id: null }, lea)).toBe(false);
    expect(appointmentForProfile({ child_id: null, pregnancy_id: 'p1' }, preg)).toBe(true);
    expect(appointmentForProfile({ child_id: null, pregnancy_id: null }, preg)).toBe(true);
    expect(appointmentForProfile({ child_id: 'c1', pregnancy_id: null }, preg)).toBe(false);
    expect(appointmentForProfile({ child_id: null, pregnancy_id: 'p1' }, me)).toBe(false);
    expect(appointmentForProfile({ child_id: null, pregnancy_id: null }, me)).toBe(true);
    expect(appointmentForProfile({ child_id: 'c2', pregnancy_id: null }, all)).toBe(true);
  });

  it('relais, garde et tâches', () => {
    expect(shiftForProfile({ kind: 'night', user_id: 'u2' }, lea, 'u1')).toBe(true);
    expect(shiftForProfile({ kind: 'me_time', user_id: 'u1' }, lea, 'u1')).toBe(false);
    expect(shiftForProfile({ kind: 'me_time', user_id: 'u1' }, me, 'u1')).toBe(true);
    expect(shiftForProfile({ kind: 'night', user_id: 'u2' }, me, 'u1')).toBe(false);
    expect(custodyForProfile({ childId: 'c1' }, lea)).toBe(true);
    expect(custodyForProfile({ childId: 'c2' }, lea)).toBe(false);
    expect(custodyForProfile({ childId: null }, lea)).toBe(true);
    expect(custodyForProfile({ childId: 'c1' }, me)).toBe(false);
    // tâches : pas d'enfant rattaché → celles du foyer ; pour « Moi », les miennes, à prendre, demandées par moi
    const task = (ownerId: string | null, creatorId: string | null, awaitsMe = false) => ({ ownerId, creatorId, awaitsMe });
    expect(taskForProfile(task('u2', 'u2'), lea)).toBe(true);
    expect(taskForProfile(task('u2', 'u2'), me)).toBe(false);
    expect(taskForProfile(task('u1', 'u2'), me)).toBe(true);
    expect(taskForProfile(task(null, 'u2'), me)).toBe(true);
    expect(taskForProfile(task('u2', 'u1'), me)).toBe(true);
    expect(taskForProfile(task('u2', 'u2', true), me)).toBe(true);
  });
});
