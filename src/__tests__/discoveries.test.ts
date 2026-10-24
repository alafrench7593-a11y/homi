/**
 * « Ses découvertes », « Je grandis », « Près de chez moi » (logique pure) : âges, disponibilité jamais obligatoire,
 * progression sans compétition, semaine, historique, idées, recettes avec aliments déjà goûtés, sécurité après une
 * réaction, étapes par tranche d'âge, résumé factuel, requêtes et lecture des services publics, distances, carte,
 * annuaires réels, aucune position précise transmise.
 */
import { FOODS, FOOD_BY_KEY, FOOD_CATEGORIES, DISCOVERY_SOURCES } from '@/content/discoveries/foods';
import { STEPS, STEP_CATEGORIES, STEP_SOURCES, MAIN_STEP_KEYS, AGE_BANDS } from '@/content/discoveries/steps';
import {
  ageInMonths, availability, bandFor, discoveredThisWeek, displayState, factualSummary, FORBIDDEN_GROW, freeFood, ideasForAge, progressByCategory,
  reactionAdvice, recentObservations, recipeFoods, recipesWithTasted, stepAvailable, stepsInBand, topCategories, visibleHistory, type ChildStep,
} from '@/lib/domain/discoveries';
import {
  approxDistance, coarse, DIRECTORIES, directionsUrl, directoryUrl, distanceM, geocodeUrl, mapView, OSM_KINDS, overpassQuery, parseGeocode, parseOverpass, PLACE_KINDS, validTownQuery,
} from '@/lib/domain/nearby';
import { FR } from '@/i18n/dictionaries';
import type { Recipe } from '@/lib/recipes/types';

const fr = FR as Record<string, string | Record<string, string>>;
const text = (k: string) => (typeof fr[k] === 'string' ? (fr[k] as string) : Object.values(fr[k] as Record<string, string>).join(' '));

describe('catalogue des aliments', () => {
  it('13 catégories, chaque aliment illustrable, conseils de préparation, sources datées', () => {
    expect(FOOD_CATEGORIES).toHaveLength(13);
    for (const c of FOOD_CATEGORIES) expect(FOODS.some((f) => f.category === c)).toBe(true);
    expect(FOODS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(FOODS.map((f) => f.key)).size).toBe(FOODS.length);
    for (const f of FOODS) { expect(f.prep.length).toBeGreaterThan(5); expect(f.tint).toMatch(/^#[0-9A-F]{6}$/i); }
    for (const s of Object.values(DISCOVERY_SOURCES)) { expect(s.url).toMatch(/^https:\/\//); expect(s.consulted).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
  });
  it('repères officiels : miel après 1 an (ANSES), soja après 3 ans (SPF), lait cru déconseillé, aliments ronds jusqu’à 5 ans', () => {
    expect(FOOD_BY_KEY.honey).toMatchObject({ minMonths: 12, source: 'anses_miel' });
    expect(FOOD_BY_KEY.soy).toMatchObject({ minMonths: 36, source: 'spf' });
    expect(FOOD_BY_KEY.raw_milk_cheese.minMonths).toBe(60);
    expect(FOOD_BY_KEY.peanut.care).toMatch(/5 ans/);
    expect(FOOD_BY_KEY.grape.care).toMatch(/quatre/);
    // allergènes dès le début de la diversification (SPF), jamais repoussés sans source
    for (const k of ['egg', 'peanut', 'almond', 'white_fish', 'pasta']) expect(FOOD_BY_KEY[k].minMonths ?? 4).toBe(4);
  });
  it('jamais « doit absolument » : disponibilité, pas obligation', () => {
    const all = JSON.stringify(FOODS) + Object.keys(fr).filter((k) => k.startsWith('dc.')).map(text).join(' ');
    expect(all).not.toMatch(/doit absolument|obligatoire de goûter|il faut absolument/i);
    expect(fr['dc.state.to_discover_long']).toBe('À découvrir lorsque son âge et sa situation le permettent');
    expect(fr['dc.state.discovered']).toBe('Déjà découvert');
    expect(fr['dc.state.retry_later']).toBe('À reproposer plus tard');
    expect(availability(FOOD_BY_KEY.honey, 8)).toBe('later');
    expect(availability(FOOD_BY_KEY.honey, 13)).toBe('now');
  });
  it('version gratuite : aliments essentiels de chaque catégorie et tous les allergènes', () => {
    for (const c of FOOD_CATEGORIES) expect(FOODS.filter((f) => f.category === c && freeFood(f)).length).toBeGreaterThan(0);
    for (const f of FOODS.filter((x) => x.allergen)) expect(freeFood(f)).toBe(true);
    expect(FOODS.filter((f) => !freeFood(f)).length).toBeGreaterThan(20);
  });
});

describe('carnet de diversification', () => {
  const e = (food_key: string, status: 'not_yet' | 'tasted' | 'liked' | 'refused', reaction = false) => ({ food_key, status, reaction });
  it('âge en mois révolus', () => {
    expect(ageInMonths('2026-02-15', '2026-10-14')).toBe(7);
    expect(ageInMonths('2026-02-15', '2026-10-15')).toBe(8);
  });
  it('états affichés : déjà découvert, à reproposer plus tard, à découvrir, plus tard', () => {
    expect(displayState({ status: 'liked' }, FOOD_BY_KEY.carrot, 6)).toBe('discovered');
    expect(displayState({ status: 'refused' }, FOOD_BY_KEY.carrot, 6)).toBe('retry_later');
    expect(displayState(undefined, FOOD_BY_KEY.carrot, 6)).toBe('to_discover');
    expect(displayState({ status: 'not_yet' }, FOOD_BY_KEY.honey, 6)).toBe('not_yet_age');
  });
  it('« Lina a découvert 8 légumes et 6 fruits » : progression par catégorie, sans total', () => {
    const veg = FOODS.filter((f) => f.category === 'veg').slice(0, 8).map((f) => e(f.key, 'tasted'));
    const fruit = FOODS.filter((f) => f.category === 'fruit').slice(0, 6).map((f) => e(f.key, 'liked'));
    const p = progressByCategory([...veg, ...fruit, e('egg', 'not_yet')]);
    expect(p.veg).toBe(8); expect(p.fruit).toBe(6); expect(p.egg).toBe(0);
    expect(topCategories(p)).toEqual([{ category: 'veg', count: 8 }, { category: 'fruit', count: 6 }]);
    expect(String((fr['dc.hero.line'] as string))).toBe('{name} a découvert {a} et {b}');
    const keys = Object.keys(fr).filter((k) => /^(dc|gr|cs)\./.test(k)).map(text).join(' ');
    for (const re of FORBIDDEN_GROW) expect(keys).not.toMatch(re);
  });
  it('cette semaine : 7 derniers jours, un aliment une seule fois', () => {
    const t = [{ food_key: 'carrot', food_name: 'Carotte', tasted_on: '2026-10-21' }, { food_key: 'carrot', food_name: 'Carotte', tasted_on: '2026-10-18' },
      { food_key: 'pear', food_name: 'Poire', tasted_on: '2026-10-16' }, { food_key: 'egg', food_name: 'Œuf', tasted_on: '2026-10-15' }];
    expect(discoveredThisWeek(t, '2026-10-22')).toEqual(['carrot', 'pear']);
  });
  it('historique : 30 jours en gratuit, tout avec Premium, jamais supprimé', () => {
    const t = [{ tasted_on: '2026-10-20' }, { tasted_on: '2026-09-23' }, { tasted_on: '2026-09-22' }, { tasted_on: '2026-01-02' }];
    expect(visibleHistory(t, '2026-10-22', false).map((x) => x.tasted_on)).toEqual(['2026-10-20', '2026-09-23']);
    expect(visibleHistory(t, '2026-10-22', true)).toHaveLength(4);
  });
  it('idées adaptées à l’âge : jamais un aliment déjà goûté, jamais avant l’âge, allergie déclarée exclue, catégories variées', () => {
    const ideas = ideasForAge([e('carrot', 'tasted'), e('pear', 'liked')], 7, 6, ['eggs']);
    expect(ideas).toHaveLength(6);
    expect(ideas.map((f) => f.key)).not.toContain('carrot');
    expect(ideas.some((f) => f.key === 'honey' || f.key === 'soy')).toBe(false);
    expect(ideas.some((f) => f.allergen === 'eggs')).toBe(false);
    expect(new Set(ideas.map((f) => f.category)).size).toBe(6);
  });
  it('recettes avec les aliments déjà goûtés : aliment choisi + autres déjà goûtés sans réaction, âge respecté', () => {
    const R = (slug: string, keys: string[], minMonths = 6): Recipe => ({ id: slug, slug, title: slug, audiences: ['baby'], minMonths, ingredients: keys.map((key) => ({ key, qty: 1, unit: null })), status: 'validated' } as unknown as Recipe);
    const recipes = [R('puree-carotte-pdt', ['carrot', 'potato']), R('puree-carotte-oeuf', ['carrot', 'egg']), R('compote-plus-tard', ['carrot'], 12)];
    expect(recipeFoods(recipes[0]).sort()).toEqual(['carrot', 'potato']);
    expect(recipesWithTasted(recipes, [e('potato', 'tasted'), e('egg', 'tasted', true)], 8, 'carrot').map((r) => r.slug)).toEqual(['puree-carotte-pdt']);
    expect(recipesWithTasted(recipes, [e('potato', 'tasted'), e('carrot', 'liked')], 8).map((r) => r.slug)).toEqual(['puree-carotte-pdt']);
  });
  it('réaction : urgence (15/112) dès un signe grave, sinon conseil ; jamais de diagnostic', () => {
    expect(reactionAdvice(['hives'])).toBe('advice');
    expect(reactionAdvice(['redness_mouth', 'swelling'])).toBe('emergency');
    expect(reactionAdvice(['breathing'])).toBe('emergency');
    expect(fr['dc.rx.noDiagnosis']).toBe('L’application ne diagnostique jamais une allergie.');
    expect(text('dc.rx.emergencyTitle')).toMatch(/15.*112/);
    expect(Object.keys(fr).filter((k) => k.startsWith('dc.')).map(text).join(' ')).not.toMatch(/c'est une allergie|est allergique|diagnostic d'allergie/i);
  });
});

describe('Je grandis', () => {
  it('10 catégories, repères sourcés, explication, activité, sécurité, question, aucune échéance', () => {
    expect(STEP_CATEGORIES).toHaveLength(10);
    for (const c of STEP_CATEGORIES) expect(STEPS.some((s) => s.category === c)).toBe(true);
    for (const s of STEPS) {
      expect(STEP_SOURCES[s.source].url).toMatch(/^https:\/\//);
      for (const x of [s.what, s.play, s.safety, s.ask]) expect(x.length).toBeGreaterThan(5);
      for (const re of FORBIDDEN_GROW) expect(`${s.title} ${s.what}`).not.toMatch(re);
      expect(s.around[1]).toBeGreaterThanOrEqual(s.around[0]);
    }
    // exemples demandés
    for (const k of ['holds_head', 'rolls_over', 'grasps', 'hand_to_hand', 'sits_alone', 'moves_around', 'makes_sounds', 'name', 'points', 'says_words']) expect(STEPS.map((s) => s.key)).toContain(k);
    expect(fr['gr.rhythm']).toMatch(/Chaque enfant évolue à son propre rythme/);
    expect(fr['gr.heroTitle']).toBe('Les découvertes de {name}');
    expect(fr['gr.recent']).toBe('Ce que vous avez observé récemment');
  });
  it('quatre statuts sans jugement, dont « je ne souhaite pas la suivre »', () => {
    expect(['observed', 'in_progress', 'not_yet', 'not_tracked'].map((s) => fr[`gr.status.${s}`])).toEqual(['Observée', 'En cours d’acquisition', 'Pas encore observée', 'Je ne souhaite pas la suivre']);
  });
  it('tranches d’âge et étapes principales gratuites', () => {
    expect(bandFor(4).key).toBe('3_6');
    expect(bandFor(100).key).toBe(AGE_BANDS[AGE_BANDS.length - 1].key);
    const b = stepsInBand({ from: 6, to: 9 });
    expect(b.map((s) => s.key)).toEqual(expect.arrayContaining(['sits_alone', 'hand_to_hand']));
    expect(MAIN_STEP_KEYS.length).toBeGreaterThan(15);
    const nonMain = STEPS.find((s) => !s.main)!;
    expect(stepAvailable(nonMain, false)).toBe(false);
    expect(stepAvailable(nonMain, true)).toBe(true);
  });
  it('« Ce que vous avez observé récemment » et résumé factuel sans interprétation', () => {
    const rows: ChildStep[] = [
      { id: '1', child_id: 'c', step_key: 'sits_alone', status: 'observed', observed_on: '2026-10-20', note: 'Sur le tapis', updated_at: '2026-10-20T10:00:00Z' },
      { id: '2', child_id: 'c', step_key: 'moves_around', status: 'in_progress', observed_on: null, note: null, updated_at: '2026-10-21T10:00:00Z' },
      { id: '3', child_id: 'c', step_key: 'points', status: 'not_tracked', observed_on: null, note: null, updated_at: '2026-10-22T10:00:00Z' },
      { id: '4', child_id: 'c', step_key: 'walks', status: 'not_yet', observed_on: null, note: null, updated_at: '2026-10-19T10:00:00Z' },
    ];
    expect(recentObservations(rows).map((r) => r.step_key)).toEqual(['moves_around', 'sits_alone']);
    const s = factualSummary('Lina', 9, rows, ['Comment l’aider à gagner en équilibre ?']);
    expect(s[0]).toMatch(/Lina, 9 mois — notes du parent/);
    expect(s.join('\n')).toContain('• Tient assis sans appui : observée (le 20/10/2026) — « Sur le tapis »');
    expect(s.join('\n')).toContain('• Marche seul : pas encore observée');
    expect(s.join('\n')).not.toContain('Montre du doigt');
    for (const re of [...FORBIDDEN_GROW, /trouble|anormal|diagnostic de/i]) expect(s.join(' ')).not.toMatch(re);
  });
});

describe('Près de chez moi', () => {
  it('requête Overpass : types publics, rayon borné, position arrondie', () => {
    const q = overpassQuery(['park', 'library'], 45.764043, 4.835659, 2000);
    expect(q).toContain('["leisure"="park"]["name"](around:2000,45.76404,4.83566)');
    expect(q).toContain('["amenity"="library"]');
    expect(q.startsWith('[out:json]')).toBe(true);
    expect(overpassQuery(['park'], 45, 4, 999999)).toContain('around:10000');
    expect(coarse({ lat: 45.764043, lon: 4.835659 })).toEqual({ lat: 45.76, lon: 4.84 });
  });
  it('lecture des lieux : nom obligatoire, type reconnu, adresse, horaires, accès tel que renseigné, source et date', () => {
    const places = parseOverpass({ elements: [
      { type: 'node', id: 1, lat: 45.76, lon: 4.83, tags: { amenity: 'library', name: 'Médiathèque', 'addr:housenumber': '3', 'addr:street': 'rue des Livres', 'addr:postcode': '69007', 'addr:city': 'Lyon', opening_hours: 'Tu-Sa 10:00-18:00', wheelchair: 'yes', website: 'http://exemple.test' } },
      { type: 'way', id: 2, center: { lat: 45.77, lon: 4.84 }, tags: { leisure: 'park', name: 'Parc des Tilleuls' } },
      { type: 'node', id: 3, lat: 45.7, lon: 4.8, tags: { leisure: 'park' } },
      { type: 'node', id: 4, lat: 45.7, lon: 4.8, tags: { amenity: 'cafe', name: 'Café sans équipement' } },
      { type: 'node', id: 5, lat: 45.7, lon: 4.8, tags: { amenity: 'cafe', name: 'Café des familles', changing_table: 'yes' } },
      { type: 'node', id: 1, lat: 45.76, lon: 4.83, tags: { amenity: 'library', name: 'Médiathèque' } },
    ] }, '2026-10-22');
    expect(places.map((p) => p.id)).toEqual(['osm:node/1', 'osm:way/2', 'osm:node/5']);
    expect(places[0]).toMatchObject({ kind: 'library', address: '3 rue des Livres, 69007 Lyon', hours: 'Tu-Sa 10:00-18:00', wheelchair: 'yes', website: 'https://exemple.test', source: 'OpenStreetMap', fetchedOn: '2026-10-22' });
    expect(places[1]).toMatchObject({ kind: 'park', lat: 45.77, address: null, wheelchair: null });
    expect(places[2]).toMatchObject({ kind: 'family_cafe', changingTable: true });
  });
  it('commune : ville ou code postal, jamais une adresse personnelle ; lecture GeoJSON', () => {
    expect(validTownQuery('77500')).toBe(true);
    expect(validTownQuery('Lyon')).toBe(true);
    expect(validTownQuery('8 bis allée des Tilleuls')).toBe(false);
    expect(validTownQuery('12 rue de la Paix')).toBe(false);
    expect(geocodeUrl(' Saint-Étienne ')).toBe('https://data.geopf.fr/geocodage/search?q=Saint-%C3%89tienne&type=municipality&limit=5');
    expect(parseGeocode({ features: [{ properties: { label: 'Lyon', city: 'Lyon', postcode: '69001' }, geometry: { coordinates: [4.835, 45.758] } }, { properties: {}, geometry: { coordinates: [1, 2] } }] }))
      .toEqual([{ label: 'Lyon', city: 'Lyon', postcode: '69001', lat: 45.758, lon: 4.835 }]);
  });
  it('distance approximative, jamais au mètre', () => {
    const d = distanceM({ lat: 45.7640, lon: 4.8357 }, { lat: 45.7578, lon: 4.8320 });
    expect(d).toBeGreaterThan(700); expect(d).toBeLessThan(800);
    expect(approxDistance(d)).toBe('environ 700 m');
    expect(approxDistance(1240)).toBe('environ 1 km');
    expect(approxDistance(1300)).toBe('environ 1,5 km');
    expect(approxDistance(40)).toBe('environ 100 m');
  });
  it('carte : tuiles autour du centre, point central au milieu', () => {
    const v = mapView({ lat: 45.764, lon: 4.8357 }, 14, 340, 260);
    expect(v.tiles.length).toBeGreaterThanOrEqual(4);
    for (const t of v.tiles) expect(t.url).toMatch(/^https:\/\/tile\.openstreetmap\.org\/14\/\d+\/\d+\.png$/);
    const c = v.point({ lat: 45.764, lon: 4.8357 });
    expect(Math.round(c.x)).toBe(170); expect(Math.round(c.y)).toBe(130);
  });
  it('itinéraire : seulement la destination (jamais la position de départ)', () => {
    expect(directionsUrl({ lat: 45.76, lon: 4.83, name: 'Parc' }, 'ios')).toBe('https://maps.apple.com/?daddr=45.760000,4.830000&q=Parc');
    expect(directionsUrl({ lat: 45.76, lon: 4.83 }, 'android')).toBe('https://www.google.com/maps/dir/?api=1&destination=45.760000,4.830000');
  });
  it('annuaires réels pour les types sans données ouvertes, jamais de lieu inventé', () => {
    for (const k of PLACE_KINDS.filter((x) => !OSM_KINDS.includes(x))) expect(DIRECTORIES.some((d) => d.kind === k)).toBe(true);
    for (const d of DIRECTORIES) { expect(d.url || d.annuaire || d.phone).toBeTruthy(); expect(d.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
    const pmi = DIRECTORIES.find((d) => d.annuaire?.includes('PMI'))!;
    expect(directoryUrl(pmi, 'Lyon')).toBe('https://lannuaire.service-public.fr/recherche?whoWhat=Centre+de+protection+maternelle+et+infantile+PMI&where=Lyon');
    expect(DIRECTORIES.find((d) => d.phone)?.phone).toBe('0800003456');
  });
  it('aucune messagerie, aucun rendez-vous entre membres, aucune position de membre', () => {
    const all = Object.keys(fr).filter((k) => k.startsWith('nb.')).map(text).join(' ');
    expect(all).toMatch(/ni messagerie ni rendez-vous entre membres/);
    expect(all).not.toMatch(/envoyer un message|proposer un rendez-vous|membres près de vous|partager ma position/i);
  });
});
