/**
 * Centre d'outils (17/11/2026) — garde-fous du nouveau modèle :
 *  - registre : un besoin = une entrée, 9 catégories + l'espace Communauté et « Mon compte et réglages » (à part) ;
 *  - chaque outil a un nom, une description d'UNE phrase, des mots de recherche, un pictogramme propre, des profils,
 *    un statut Premium et une route, dans les 5 langues ;
 *  - anciens identifiants toujours résolus ; favoris migrés de `thème:adresse` vers l'identifiant stable ;
 *  - recherche par besoin : requêtes réalistes, et « aucun outil » quand rien ne correspond (jamais au hasard).
 */
import { setLocale, tMaybe } from '@/i18n';
import { TOOL_GLYPHS } from '@/components/toolGlyphIcons';
import { accountEntries, categoryContent, favoriteTools, featuredTools, findEntry, migrateToolIds, toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import { legacyKeyToToolId } from '@/lib/domain/toolLegacy';
import { foldText, queryTokens, searchCatalog, wordMatch } from '@/lib/domain/toolSearch';
import {
  canonicalToolId, CATEGORY_TOOLS, FEATURED, REAL_TOOLS, resolveTool, SCOPES, TOOL_ALIASES, TOOL_BY_ID, TOOL_CATEGORIES, toolDescKey, toolLabelKey, toolProblemKey, toolProfiles, TOOLS, toolWordsKey,
  type ScopeCtx,
} from '@/lib/journeys/tools';

const MCI = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json') as Record<string, number>;

const LANGS = ['fr', 'en', 'es', 'de', 'it'] as const;
const CTXS: ScopeCtx[] = [
  { scope: 'avoid' }, { scope: 'ttc' }, { scope: 'cycle' }, { scope: 'none' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1', postpartum: true }, { scope: 'baby', childId: 'c1', postpartum: true }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];
/** Tous les outils atteignables, tous profils confondus (comme la recherche de « Mes outils »). */
function everyTool(): CatalogTool[] {
  const seen = new Map<string, CatalogTool>();
  for (const c of CTXS) for (const t of toolCatalog(c)) if (!seen.has(t.id)) seen.set(t.id, t);
  return [...seen.values()];
}

describe('registre : un besoin = une entrée', () => {
  beforeAll(() => setLocale('fr'));

  it('126 outils dans 9 catégories, l’espace Communauté et 9 entrées de compte à part (144 entrées avant la refonte)', () => {
    // 21/11/2026 : « Garde et nounou », « Se comprendre », « Ma place dans la famille » ; « Mes informations » (compte)
    expect(REAL_TOOLS).toHaveLength(128);
    expect(CATEGORY_TOOLS).toHaveLength(127);
    expect(TOOLS.filter((d) => d.category === 'account').map((d) => d.id).sort()).toEqual(['account_delete', 'home_settings', 'journeys', 'my_info', 'notifications', 'preg_edit', 'preg_end', 'settings', 'sign_out']);
    const counts = Object.fromEntries(TOOL_CATEGORIES.map((c) => [c, REAL_TOOLS.filter((d) => d.category === c).length]));
    expect(counts).toEqual({ feeding: 12, sleep: 6, care: 12, health: 22, cycle: 29, pregnancy: 15, school: 5, couple: 11, family: 15 });
    expect(new Set(TOOLS.map((d) => d.id)).size).toBe(TOOLS.length);
  });

  it('aucun outil du catalogue n’est une entrée de compte, et inversement', () => {
    for (const c of CTXS) {
      expect(toolCatalog(c).some((x) => x.category === 'account')).toBe(false);
      expect(accountEntries(c).map((x) => x.id)).toEqual(expect.arrayContaining(['settings', 'notifications', 'journeys']));
      expect(accountEntries(c).every((x) => x.category === 'account')).toBe(true);
    }
  });

  it('pour un profil donné, deux outils n’ouvrent jamais la même adresse', () => {
    for (const c of CTXS) {
      const hrefs = toolCatalog(c).map((x) => x.href);
      expect(hrefs.filter((h, i) => hrefs.indexOf(h) !== i)).toEqual([]);
    }
  });

  it('les anciens identifiants (doublons, filtres, onglets, guides) restent résolus', () => {
    const expected: Record<string, string> = {
      avoid_cycle: 'cycle_home', ttc_periods: 'cycle_home', avoid_fertile: 'cycle_calendar', ttc_calendar: 'cycle_calendar',
      pp_feeding: 'baby_breastfeed', pp_bottle: 'baby_bottle_timer', family_summary: 'summary', official_videos: 'videos', video_tutos: 'videos.tutos',
      ttc_articles: 'library.conception', preg_articles: 'library.pregnancy', preg_birth_prep: 'library.birth', preg_intimacy: 'library.intimacy',
      kid_growth: 'kid_profile.growth', kid_milestones: 'kid_profile.milestones', kid_needs: 'kid_treatments.needs',
      family_responsibilities: 'family_domains.responsibilities', guide_kidsleep: 'guides.kidsleep', guide_work: 'guides.work',
    };
    for (const [old, now] of Object.entries(expected)) expect(canonicalToolId(old)).toBe(now);
    expect(Object.keys(TOOL_ALIASES).filter((k) => k.startsWith('guide_'))).toHaveLength(15);
    // un ancien identifiant répond encore dans TOOL_BY_ID (recommandations d'onboarding, liens écrits avant la fusion)
    expect(TOOL_BY_ID.ttc_calendar.id).toBe('cycle_calendar');
    expect(resolveTool('guide_kidsleep')?.sub?.href({ scope: 'child' })).toBe('/guide/kidsleep');
    expect(canonicalToolId('nexiste_pas')).toBeNull();
  });

  it('sous-accès : filtres de la bibliothèque, onglets de la fiche enfant, guides selon le profil', () => {
    const child = toolCatalog({ scope: 'child', childId: 'c2' });
    expect(findEntry(child, 'kid_profile')?.subs.map((s) => s.href)).toEqual(['/child/c2?tab=croissance', '/child/c2?tab=etapes']);
    expect(findEntry(child, 'kid_profile.growth')).toMatchObject({ parent: 'kid_profile', href: '/child/c2?tab=croissance' });
    const preg = toolCatalog({ scope: 'pregnancy', pregnancyId: 'p1' });
    expect(findEntry(preg, 'library')?.subs.map((s) => s.id)).toEqual(['library.pregnancy', 'library.birth', 'library.intimacy']);
    expect(findEntry(toolCatalog({ scope: 'cycle' }), 'library')?.subs).toEqual([]);
    // « à lire » : le guide du sommeil est proposé dans la catégorie Sommeil, pas comme un outil
    const { tools, readings } = categoryContent(child, 'sleep');
    expect(tools.map((x) => x.id)).toEqual(expect.arrayContaining(['kid_sleep', 'sleep_help', 'family_nights']));
    expect(readings.map((x) => x.id)).toEqual(['guides.kidsleep']);
  });

  it('écrans autrefois hors registre : désormais des outils', () => {
    for (const id of ['journal', 'medications', 'kid_album', 'health_book', 'meal_menu', 'meal_pantry', 'cycle_pain', 'cycle_discharge', 'cycle_bleeding', 'sleep_help', 'kid_school', 'me_diary']) {
      expect(REAL_TOOLS.some((d) => d.id === id)).toBe(true);
    }
  });

  it('« Pour <profil> » : 6 outils au plus, tous disponibles pour le profil, sans urgence', () => {
    for (const c of CTXS) {
      const cat = toolCatalog(c);
      const f = featuredTools(cat, c.scope);
      expect(f.length).toBeGreaterThan(0);
      expect(f.length).toBeLessThanOrEqual(6);
      expect(f.every((x) => cat.includes(x) && !x.urgent)).toBe(true);
      expect(new Set(f.map((x) => x.id)).size).toBe(f.length);
    }
    for (const s of SCOPES) for (const id of FEATURED[s]) expect(REAL_TOOLS.some((d) => d.id === id)).toBe(true);
  });
});

describe('chaque outil : nom, phrase, mots de recherche, pictogramme, profils, Premium', () => {
  it.each(LANGS)('%s : nom, description d’une phrase et mots de recherche pour chaque entrée', (lang) => {
    setLocale(lang);
    const bad: string[] = [];
    for (const d of TOOLS) {
      const name = tMaybe(toolLabelKey(d.id));
      const desc = tMaybe(toolDescKey(d.id));
      const words = tMaybe(toolWordsKey(d.id));
      if (!name || name.length > 48) bad.push(`${d.id}: nom`);
      // UNE phrase : majuscule, point final, pas de seconde phrase, assez courte pour s'afficher en entier dans la liste
      if (!desc || !/^[A-ZÀ-ÝÄÖÜ¿¡]/.test(desc) || !/[.!?]$/.test(desc) || /[.!?]\s+[A-ZÀ-Ý]/.test(desc) || desc.length < 30 || desc.length > 100) bad.push(`${d.id}: description « ${desc} »`);
      if (!words || words.split(';').filter((w) => w.trim()).length < 4) bad.push(`${d.id}: mots de recherche`);
    }
    expect(bad).toEqual([]);
    setLocale('fr');
  });

  it.each(LANGS)('%s : deux outils ne portent jamais le même nom', (lang) => {
    setLocale(lang);
    const names = REAL_TOOLS.map((d) => tMaybe(toolLabelKey(d.id)));
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
    setLocale('fr');
  });

  it.each(LANGS)('%s : « Problème résolu » rédigé pour chaque entrée (une phrase sur la situation du parent, longueur bornée)', (lang) => {
    setLocale(lang);
    const bad: string[] = [];
    const seen = new Map<string, string>();
    for (const d of TOOLS) {
      const p = tMaybe(toolProblemKey(d.id));
      // une phrase : majuscule, point final, pas de seconde phrase, ni fragments de mots-clés (« · », « ; »)
      if (!p || !/^[A-ZÀ-ÝÄÖÜ¿¡]/.test(p) || !/[.!?]$/.test(p) || /[.!?]\s+[A-ZÀ-Ý]/.test(p) || /[·;]/.test(p) || p.length < 30 || p.length > 130) bad.push(`${d.id}: « ${p} »`);
      else if (seen.has(p)) bad.push(`${d.id}: même phrase que ${seen.get(p)}`);
      else seen.set(p, d.id);
    }
    expect(bad).toEqual([]);
    setLocale('fr');
  });

  it('« Problème résolu » : sobre (aucune promesse ni superlatif)', () => {
    setLocale('fr');
    const words = /\b(garanti|guérir|guérit|miracle|meilleur|parfait|idéal|révolutionnaire|incroyable|enfin)\b/i;
    expect(TOOLS.map((d) => [d.id, tMaybe(toolProblemKey(d.id)) ?? '']).filter(([, p]) => words.test(p))).toEqual([]);
    expect(tMaybe(toolProblemKey('family_nights'))).toBe('Tu te lèves toutes les nuits et l’autre parent ne sait pas quand prendre le relais.');
  });

  it('pictogramme : un symbole existant et DISTINCT par outil (144 outils pour 66 icônes avant)', () => {
    const glyphs = TOOLS.map((d) => TOOL_GLYPHS[d.id]);
    expect(TOOLS.filter((d) => !TOOL_GLYPHS[d.id] || !MCI[TOOL_GLYPHS[d.id]]).map((d) => d.id)).toEqual([]);
    expect(new Set(glyphs).size).toBe(TOOLS.length);
    // sous-accès : un symbole existant aussi
    for (const d of TOOLS) for (const s of d.subs ?? []) expect(MCI[TOOL_GLYPHS[`${d.id}.${s.id}`]]).toBeDefined();
    // icône au trait (repli) : presque toujours distincte elle aussi
    expect(new Set(TOOLS.map((d) => d.icon)).size).toBeGreaterThanOrEqual(TOOLS.length - 2);
  });

  it('profils lisibles et statut Premium calculé depuis les règles d’accès', () => {
    expect(toolProfiles(TOOL_BY_ID.cycle_home)).toEqual(['me']);
    expect(toolProfiles(TOOL_BY_ID.kid_sleep)).toEqual(['baby', 'child']);
    expect(toolProfiles(TOOL_BY_ID.appointments)).toHaveLength(6);
    const all = everyTool();
    const free = all.filter((x) => x.free).map((x) => x.id).sort();
    // « Garde et nounou » (/garde) : ouvert sans abonnement par src/lib/premium/access.ts (rejoindre une garde, « Mes gardes »)
    expect(free).toEqual(['avoid_emergency', 'childcare', 'emergency', 'family_sos', 'family_urgent', 'pp_support', 'recall_alerts', 'sources']);
    expect(all.every((x) => x.profiles.length > 0 && x.href.startsWith('/'))).toBe(true);
  });
});

describe('favoris : identifiant stable de l’outil', () => {
  beforeAll(() => setLocale('fr'));

  it('migre les anciennes clés `thème:adresse` (une par profil, par enfant, par route) vers l’identifiant stable', () => {
    const old = [
      'feeding:/meals?for=baby&child=:id', 'feeding:/meals?for=avoid', // « Repas » avait une clé par profil
      'sleep:/sleep/c1',                                                // identifiant d'enfant resté dans la clé
      'cycle:/cycle', 'cycle:/cycle/calendar',
      'resources:/library?q=conception', 'growth:/child/:id/growth', 'growth:/child/:id?tab=etapes',
      'resources:/(tabs)/community?space=grossesse', 'tasks:/summary?family=1', 'health:/guide/illnesses',
      'feeding:/bottle/:id', 'feeding:/track/breastfeed?child=:id', 'reminders:/settings', 'diapers:/(tabs)/track',
      'inconnu:/nulle/part', 42, null,
    ];
    expect(migrateToolIds(old)).toEqual([
      'meals', 'kid_sleep_rhythm', 'cycle_home', 'cycle_calendar', 'library.conception', 'kid_profile.growth', 'kid_profile.milestones',
      'community', 'summary', 'guides.illnesses', 'baby_bottle_timer', 'baby_breastfeed', 'settings', 'baby_daily',
    ]);
  });

  it('accepte aussi un ancien identifiant d’outil, et reste idempotente', () => {
    expect(migrateToolIds(['pp_bottle', 'ttc_calendar', 'kid_sleep', 'guide_work'])).toEqual(['baby_bottle_timer', 'cycle_calendar', 'kid_sleep', 'guides.work']);
    const once = migrateToolIds(['cycle:/cycle', 'kid_sleep', 'guides.work']);
    expect(migrateToolIds(once)).toEqual(once);
    expect(migrateToolIds(undefined)).toEqual([]);
    expect(legacyKeyToToolId('kid_sleep')).toBeNull();
  });

  it('un favori survit au changement de profil, de thème et de route', () => {
    const favs = migrateToolIds(['feeding:/meals?for=avoid', 'growth:/child/:id/growth']);
    expect(favoriteTools(toolCatalog({ scope: 'child', childId: 'c9' }), favs).map((x) => [x.id, x.href])).toEqual([
      ['meals', '/meals?for=child&child=c9'], ['kid_profile.growth', '/child/c9?tab=croissance'],
    ]);
    expect(favoriteTools(toolCatalog({ scope: 'cycle' }), favs).map((x) => x.id)).toEqual(['meals']);
  });

});

describe('recherche par besoin', () => {
  beforeAll(() => setLocale('fr'));
  const ids = (q: string, n = 5) => searchCatalog(everyTool(), q).results.slice(0, n).map((r) => r.tool.id);

  it('normalise casse, accents, apostrophes et mots vides', () => {
    expect(foldText('  J’ai MAL au ventre… Été ! ')).toBe('j ai mal au ventre ete');
    expect(queryTokens('Mon bébé se réveille toutes les nuits', 'fr')).toEqual(['bebe', 'reveille', 'nuits']);
    expect(wordMatch('biberons', 'biberon')).toBeGreaterThan(0.9);
    expect(wordMatch('reveille', 'reveil')).toBeGreaterThan(0.5);
    expect(wordMatch('vacin', 'vaccin')).toBeGreaterThan(0);
    expect(wordMatch('lait', 'lessive')).toBe(0);
  });

  it('« Mon bébé se réveille toutes les nuits » propose les outils du sommeil et le relais de nuit', () => {
    const r = ids('Mon bébé se réveille toutes les nuits', 6);
    expect(r).toEqual(expect.arrayContaining(['kid_sleep', 'sleep_help', 'family_nights']));
    expect(r.every((id) => TOOL_BY_ID[id].category === 'sleep')).toBe(true);
  });

  // requête réaliste → outil attendu parmi les 3 premiers
  const CASES: [string, string][] = [
    ['noter un biberon', 'baby_bottle'],
    ['combien de mesurettes pour 150 ml', 'bottle_scoops'],
    ['il a fait caca trois fois', 'baby_diaper'],
    ['allaitement', 'baby_breastfeed'],
    ['idées de repas pour ce soir', 'meals'],
    ['qu’est-ce que je peux cuisiner avec ce qu’il y a dans le frigo', 'meal_pantry'],
    ['puis-je manger des sushis enceinte', 'preg_eat'],
    ['ma fille ne dort pas', 'kid_sleep'],
    ['qui se lève cette nuit', 'family_nights'],
    ['courbe de poids de mon bébé', 'kid_profile'],
    ['première dent', 'kid_teeth'],
    ['photos de mon enfant', 'kid_album'],
    ['prochain vaccin', 'kid_vaccines'],
    ['il a de la fièvre', 'kid_health'],
    ['rendez-vous chez le pédiatre', 'appointments'],
    ['ranger une ordonnance', 'documents'],
    ['rappel de médicament', 'medications'],
    ['je suis épuisée', 'exhaustion_check'],
    ['j’ai mal au ventre pendant mes règles', 'cycle_pain'],
    ['quand est mon ovulation', 'cycle_calendar'],
    ['j’ai oublié ma pilule', 'avoid_emergency'],
    ['test de grossesse positif', 'ttc_start_pregnancy'],
    ['valise de maternité', 'preg_lists'],
    ['choisir un prénom', 'preg_names'],
    ['baby blues', 'pp_mental'],
    ['inscription à la crèche', 'kid_school'],
    ['garde alternée une semaine sur deux', 'custody'],
    ['je fais tout à la maison', 'mental_load'],
    ['je n’en peux plus', 'family_sos'],
    ['liste de courses', 'family_shopping'],
    ['il n’y a plus de couches', 'family_stocks'],
    ['scanner un code-barres', 'scan_product'],
    ['sorties ce week-end', 'nearby'],
    ['VACCINS', 'kid_vaccines'],
    ['biberonn', 'baby_bottle'],
    // outils ajoutés le 21/11/2026
    ['ma femme est épuisée', 'couple_understand'],
    ['dire à mon mari que je suis fatiguée', 'couple_understand'],
    ['la nounou', 'childcare'],
    ['photo de bébé chez la nounou', 'childcare'],
    ['carnet de liaison', 'childcare'],
    ['ma place dans la famille', 'family_my_place'],
    ['missions terminées', 'family_missions'],
  ];
  it.each(CASES)('« %s » → %s', (q, expected) => {
    expect(ids(q, 3)).toContain(expected);
  });

  // rien ne correspond vraiment : liste vide, jamais de résultat au hasard
  const NONE = ['météo de demain', 'acheter une voiture d’occasion', 'résultat du match de foot', 'xqzt', 'mon bébé a des poux', 'recette de mojito pour mon chat', '?', 'le la les', ''];
  it.each(NONE)('« %s » : aucun outil ne correspond', (q) => {
    const out = searchCatalog(everyTool(), q);
    expect(out.results).toEqual([]);
    expect(out.understood).toBe(false);
  });

  it('ne propose que des outils du foyer : rien du cycle pour un profil sans cycle', () => {
    const out = searchCatalog(toolCatalog({ scope: 'baby', childId: 'c1' }), 'ovulation');
    expect(out.results).toEqual([]);
  });

  it('classe le plus précis en premier et écarte les résultats trop lointains', () => {
    expect(ids('relais de nuit', 1)).toEqual(['family_nights']);
    expect(ids('carnet de santé', 1)).toEqual(['health_book']);
    expect(searchCatalog(everyTool(), 'mesurettes').results.map((r) => r.tool.id)).toEqual(['bottle_scoops']);
    expect(searchCatalog(everyTool(), 'bébé').results.length).toBeLessThanOrEqual(12);
  });

  it('retrouve un sous-accès par son nom (croissance → fiche de l’enfant ; guide → guides)', () => {
    expect(ids('croissance', 2)).toContain('kid_profile');
    expect(ids('maladies de l’enfance', 2)).toContain('guides');
  });

  it.each([
    ['en', 'my baby wakes up every night', 'kid_sleep'],
    ['en', 'shopping list', 'family_shopping'],
    ['es', 'mi bebé se despierta por la noche', 'kid_sleep'],
    ['es', 'lista de la compra', 'family_shopping'],
    ['de', 'mein Baby wacht nachts auf', 'kid_sleep'],
    ['de', 'Einkaufsliste', 'family_shopping'],
    ['it', 'il mio bambino si sveglia di notte', 'kid_sleep'],
    ['it', 'lista della spesa', 'family_shopping'],
  ] as const)('%s : « %s » → %s', (lang, q, expected) => {
    setLocale(lang);
    expect(ids(q, 4)).toContain(expected);
    expect(searchCatalog(everyTool(), 'qwzx kjhg').results).toEqual([]);
    setLocale('fr');
  });
});
