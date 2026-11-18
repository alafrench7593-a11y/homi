/**
 * Le catalogue central est LA SEULE source de vérité des outils (18/11/2026).
 *  A. Menus : ils passent par `ToolLinks` (choix et ordre seulement) ; aucun fichier de src/app ou src/features ne
 *     redéfinit le nom, l'icône ou la route d'un outil ; aucune clé de traduction de menu ne recopie un libellé d'outil ;
 *     jamais de « Voir les N autres » : un accès NOMMÉ à la catégorie complète.
 *  B. Classement : 9 catégories, une catégorie principale par outil, raccourcis contextuels (`also`) sans second
 *     identifiant ni second favori ; couches dans les soins ; communauté hors catégories ; scanners selon leur fonction.
 *  C. Descriptions de liste : longueur bornée dans chaque langue (elles s'affichent en entier, 4 lignes au plus).
 *  D. Compatibilité : les 120 identifiants d'avant, les alias et les anciennes adresses ouvrent toujours le bon écran,
 *     avec les bons paramètres, la même règle d'accès et le même profil ; les favoris suivent.
 */
const fs = require('fs') as { readFileSync(p: string, enc: string): string; readdirSync(p: string, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };
const path = require('path') as { join(...p: string[]): string };

import { DICTIONARIES } from '@/i18n/dictionaries';
import { setLocale, tMaybe } from '@/i18n';
import { categoryAllLabel, categoryContent, categoryFromParam, categoryTitle, communityEntry, favoriteTools, findEntry, isToolCategory, migrateToolIds, toolCatalog, toolName } from '@/lib/domain/toolCatalog';
import { LEGACY_PATHS } from '@/lib/domain/toolLegacy';
import {
  allowedToolIds, canonicalCategory, canonicalToolId, CATEGORY_TOOLS, isToolAllowed, REAL_TOOLS, resolveTool, TOOL_ALIASES, TOOL_BY_ID, TOOL_CATEGORIES, toolDescKey, toolLabelKey,
  TOOLS, toolsFor, type ScopeCtx,
} from '@/lib/journeys/tools';
import { isFreeRoute } from '@/lib/premium/access';
import { APP_ROUTES } from '@/lib/routes.generated';

const LANGS = ['fr', 'en', 'es', 'de', 'it'] as const;
const CTXS: ScopeCtx[] = [
  { scope: 'avoid' }, { scope: 'ttc' }, { scope: 'cycle' }, { scope: 'none' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1', postpartum: true }, { scope: 'baby', childId: 'c1', postpartum: true }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];
const ROOT = process.cwd();
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');
function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out); else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}
const pathOf = (href: string) => (href.split('?')[0].replace('/(tabs)', '') || '/');
const PATTERNS = APP_ROUTES.map((r) => new RegExp(`^${r.replace(/\[[^\]]+\]/g, '[^/]+')}$`));
const routeExists = (href: string) => PATTERNS.some((re) => re.test(pathOf(href)));

// ------------------------------------------------------------------ A. menus
/** Les menus rebranchés : ils ne gardent que le choix et l'ordre de leurs raccourcis. */
const MENUS = [
  'src/app/cycle/index.tsx', 'src/app/pregnancy/index.tsx', 'src/app/fertility/index.tsx', 'src/app/contraception/index.tsx', 'src/app/family/index.tsx',
  'src/app/me/index.tsx', 'src/app/postpartum/index.tsx', 'src/app/(tabs)/track.tsx', 'src/app/library.tsx', 'src/features/profileHub/ProfileHub.tsx',
  'src/app/scanner/index.tsx', 'src/app/family/solo.tsx', 'src/app/(tabs)/profile.tsx', 'src/features/child.tsx', 'src/features/needs.tsx', 'src/app/child/[id]/needs.tsx',
  'src/features/hubs/HubScreen.tsx',
];
/**
 * Navigations écrites dans un menu vers l'adresse d'un outil : uniquement des ACTIONS de l'écran (bouton principal qui
 * enregistre ou ouvre la saisie du jour, lien d'une carte de données, bouton d'un état vide), jamais une rangée qui
 * présente l'outil. Toute nouvelle entrée ici doit être justifiée.
 */
const SCREEN_ACTIONS: Record<string, string[]> = {
  'src/app/cycle/index.tsx': ['/cycle/advice', '/assistant/local', '/library'], // carte « N conseils pour vous » ; question et articles du parcours (avec leur filtre)
  'src/app/pregnancy/index.tsx': ['/pregnancy/calendar', '/appointments', '/pregnancy/edit', '/settings/reminders'], // terme, prochain rendez-vous, modifier, rappel de complément
  'src/app/contraception/index.tsx': ['/contraception/reminders', '/contraception/emergency'], // bouton principal, méthode en cours, « que faire ? » après un oubli
  'src/app/me/index.tsx': ['/me/mood'],                               // bouton principal de l'écran
  'src/app/postpartum/index.tsx': ['/postpartum/checkin'],            // bouton principal : mon point du jour
  'src/app/(tabs)/track.tsx': ['/night', '/journeys', '/child/:id'],  // « La nuit commence », état vide, choix d'un enfant (profil « famille »)
  'src/app/library.tsx': ['/assistant/local'],                        // « Demander aux articles » (avec la recherche en cours)
  'src/features/profileHub/ProfileHub.tsx': ['/settings/reminders', '/appointments', '/calendar', '/family/brain-dump', '/child/:id'], // lignes de « Ma journée » et boutons d'ajout
  'src/app/scanner/index.tsx': ['/scanner/product', '/scanner/history', '/scanner/food'], // nouvelle analyse, « tout voir », choix du parcours
  'src/app/family/solo.tsx': ['/family/papers', '/videos'],           // préparer une démarche (avec la démarche), vidéos du sujet
  'src/app/(tabs)/profile.tsx': ['/journeys', '/settings/reminders', '/emergency', '/settings', '/tools', '/pregnancy', '/child/:id'], // « Ma famille » : les profils suivis ; réglages
  'src/features/child.tsx': ['/night', '/child/:id/discoveries'],     // saisie du jour ; bouton de l'onglet Alimentation de la fiche
  'src/features/needs.tsx': ['/child/:id/needs'],                     // résumé des besoins dans la fiche : ses propres onglets
  'src/app/child/[id]/needs.tsx': ['/child/:id/needs', '/appointments', '/library'], // « Pour <prénom> » : rendez-vous de l'enfant et lectures du sujet (titres personnalisés, avec leur filtre)
  'src/features/hubs/HubScreen.tsx': ['/journeys'],
  'src/app/family/index.tsx': ['/family/nights'],                     // réponse à une demande d'échange de nuit
};
const TOOL_PATHS = new Set(CTXS.flatMap((c) => toolsFor(c).map((x) => pathOf(x.href).replace(/c[12]/g, ':id'))));
const pushed = (src: string) => [...src.matchAll(/(?:router\.(?:push|replace)\(|pathname: |to: |href: )\s*(?:\{ pathname: )?['`](\/[^'`?]*)/g)].map((m) => m[1].replace(/\$\{[^}]+\}/g, ':id'));

describe('A. menus : le registre est la seule source des outils', () => {
  beforeAll(() => setLocale('fr'));

  it.each(MENUS)('%s rend ses outils par le composant partagé', (file) => {
    expect(read(file)).toMatch(/<ToolLinks\b/);
  });

  it.each(MENUS)('%s : aucune rangée écrite à la main vers un outil du registre', (file) => {
    const src = read(file);
    const allowed = new Set(SCREEN_ACTIONS[file] ?? []);
    const stray = [...new Set(pushed(src).filter((p) => TOOL_PATHS.has(p) && !allowed.has(p)))];
    expect([file, stray]).toEqual([file, []]);
    // un raccourci de menu = un identifiant du registre (actuel) : rien d'inconnu, rien d'inventé
    for (const m of src.matchAll(/ids=\{\[([^\]]*)\]\}|(?:SHORTCUTS|_TOOLS|_ACTIONS)\s*=\s*\[([^\]]*)\]\s*as const/g)) {
      for (const id of (m[1] ?? m[2] ?? '').matchAll(/'([a-z_0-9.]+)'/g)) expect([file, id[1], !!resolveTool(id[1])]).toEqual([file, id[1], true]);
    }
  });

  it('aucun fichier de src/app ou src/features ne lit un libellé d’outil ailleurs que dans le registre', () => {
    // anciennes clés `tool.<id>` : seuls `toolName` / `toolBlurb` (catalogue) et la précision d'un sous-accès y ont droit
    const allow = new Set(['src/features/offers/ToolOffer.tsx', 'src/app/family/missions/index.tsx', 'src/app/family/missions/responsibilities.tsx']);
    const bad = [...walk('src/app'), ...walk('src/features')].filter((f) => !allow.has(f) && /tr\((['`])tool\./.test(read(f)));
    expect(bad).toEqual([]);
    for (const f of allow) expect(read(f)).not.toMatch(/tr\('tool\.(?!family_responsibilities\.sub)[a-z_]+'\)/);
    // les noms « th.<id> » ne sont lus que par le catalogue
    const direct = [...walk('src/app'), ...walk('src/features')].filter((f) => /tr\((['`])th\.(?!ui\.|cat\.|p\.|sheet\.|gi\.)/.test(read(f)));
    expect(direct).toEqual([]);
  });

  it('aucun menu ni onglet ne dit « Voir les N autres » : accès nommé à la catégorie complète', () => {
    for (const f of [...MENUS, 'src/app/(tabs)/tools.tsx', 'src/app/tools/[category].tsx', 'src/features/toolHub/ToolLinks.tsx', 'src/features/hubs/hubMap.ts']) {
      expect([f, /see_more|pj\.tools\.more|cy\.nav\.more|allSections|allRubrics|Voir les \d|\{count\} autres/.test(read(f))]).toEqual([f, false]);
    }
    for (const lang of LANGS) {
      setLocale(lang);
      const labels = TOOL_CATEGORIES.map((c) => categoryAllLabel(c));
      expect(new Set(labels).size).toBe(TOOL_CATEGORIES.length);
      for (const l of labels) { expect(l.length).toBeGreaterThan(8); expect(l).not.toMatch(/\d|\{/); }
    }
    setLocale('fr');
    expect(categoryAllLabel('sleep')).toBe('Tous les outils de sommeil');
    expect(categoryAllLabel('pregnancy')).toMatch(/^Tous les outils de grossesse/);
    expect(categoryAllLabel('health')).toBe('Explorer les outils de santé');
    expect(read('src/features/toolHub/ToolLinks.tsx')).toContain('`/tools/${category}`');
  });

  it('aucune clé de traduction de menu ne recopie le nom d’un outil', () => {
    // « Contraception d'urgence » de Mon cycle : l'information gratuite /cycle/emergency (l'outil du même nom, /contraception/emergency, est celui du parcours « éviter »)
    // … et les titres qu'un écran d'outil se donne à lui-même (en-tête de la bibliothèque, « Mon cycle » et « Ma contraception » sur leur propre écran)
    const SAME_NAME_OTHER_SCREEN = new Set(['cy.nav.emergency', 'cy.nav.discharge', 'cy.nav.journal', 'cy.nav.guides', 'u1.lib.title', 'u3.fertIdx.myCycle', 'u7.contra.index.myCycle', 'u7.contra.index.myContra', 'u7.contra.index.emergTitle']);
    const MENU_KEYS = /^(cy\.nav\.|u2\.preg\.r_|u3\.fertIdx\.|u7\.contra\.index\.|u8\.me\.l\.|u5\.pp_home\.l_|u2\.fam\.|trk\.(child|preg|me)\.|hub\.(org|docs|child|me)\.|u1\.lib\.|u8\.hub\.|sol\.load\.|nav\.hub\.)/;
    for (const lang of LANGS) {
      setLocale(lang);
      const names = new Map<string, string>();
      for (const d of TOOLS) names.set((tMaybe(toolLabelKey(d.id)) ?? '').toLowerCase(), d.id);
      const dict = DICTIONARIES[lang] as Record<string, unknown>;
      const copies = Object.keys(dict).filter((k) => MENU_KEYS.test(k) && !SAME_NAME_OTHER_SCREEN.has(k) && typeof dict[k] === 'string' && names.has((dict[k] as string).toLowerCase())).map((k) => `${lang} ${k} = ${names.get((dict[k] as string).toLowerCase())}`);
      expect(copies).toEqual([]);
    }
    setLocale('fr');
  });
});

// ------------------------------------------------------------------ B. classement
describe('B. classement selon les besoins des parents', () => {
  beforeAll(() => setLocale('fr'));
  const cat = (id: string) => TOOL_BY_ID[id].category;

  it('9 catégories ; chaque outil a UNE catégorie principale ; la communauté et le compte sont à part', () => {
    expect(TOOL_CATEGORIES).toEqual(['feeding', 'sleep', 'care', 'health', 'cycle', 'pregnancy', 'school', 'couple', 'family']);
    expect(CATEGORY_TOOLS).toHaveLength(126);
    expect(REAL_TOOLS.filter((d) => d.category === 'community').map((d) => d.id)).toEqual(['community']);
    for (const d of CATEGORY_TOOLS) expect((TOOL_CATEGORIES as string[]).includes(d.category)).toBe(true);
    expect(isToolCategory('community')).toBe(false);
    expect(categoryTitle('community')).toBe('Communauté');
  });

  it('couches : soins et hygiène du bébé, pas l’alimentation ; même identifiant qu’avant', () => {
    expect(cat('baby_diaper')).toBe('care');
    expect(TOOL_BY_ID.baby_diaper.also ?? []).not.toContain('feeding');
    expect(CATEGORY_TOOLS.filter((d) => d.category === 'feeding').map((d) => d.id)).not.toContain('baby_diaper');
    expect(categoryTitle('care')).toBe('Soins, quotidien et croissance');
    const care = categoryContent(toolCatalog({ scope: 'baby', childId: 'c1' }), 'care').tools.map((x) => x.id);
    expect(care.slice(0, 3)).toEqual(['baby_daily', 'baby_diaper', 'kid_teeth']);
    // le suivi quotidien du bébé garde son raccourci vers les couches
    expect(read('src/app/(tabs)/track.tsx')).toMatch(/CHILD_SHORTCUTS = \['baby_diaper'/);
  });

  it('communauté : un espace hors des 9 catégories, présenté à part dans « Mes outils »', () => {
    for (const c of CTXS) {
      const tools = toolCatalog(c);
      expect(communityEntry(tools)?.id).toBe('community');
      for (const shelf of TOOL_CATEGORIES) {
        const { tools: own, shortcuts } = categoryContent(tools, shelf);
        expect([...own, ...shortcuts].some((x) => x.id === 'community')).toBe(false);
      }
    }
    const screen = read('src/app/(tabs)/tools.tsx');
    expect(screen).toContain('tools-community');
    expect(screen).toContain('communityEntry');
  });

  it('scanners : chacun selon sa fonction, un seul identifiant, des raccourcis ailleurs', () => {
    expect(cat('scan_food')).toBe('feeding');
    expect(TOOL_BY_ID.scan_food.also).toEqual(['pregnancy', 'health']);
    expect(cat('scan_product')).toBe('care');
    expect(TOOL_BY_ID.scan_product.also).toEqual(['health', 'pregnancy']);
    expect(cat('scan_avoid')).toBe('health');
    expect(cat('recall_alerts')).toBe('health');
    expect(CATEGORY_TOOLS.filter((d) => d.theme === 'scanner' && d.category === 'family')).toEqual([]);
    const preg = toolCatalog({ scope: 'pregnancy', pregnancyId: 'p1' });
    expect(categoryContent(preg, 'pregnancy').shortcuts.map((x) => x.id)).toEqual(expect.arrayContaining(['scan_food', 'scan_product', 'preg_eat']));
    expect(categoryContent(preg, 'health').shortcuts.map((x) => x.id)).toEqual(expect.arrayContaining(['scan_food', 'scan_product']));
  });

  it('relais de nuit dans Sommeil ; École, crèche et garde : 5 vrais outils, dont « Garde et nounou »', () => {
    expect(cat('family_nights')).toBe('sleep');
    expect(CATEGORY_TOOLS.filter((d) => d.category === 'school').map((d) => d.id)).toEqual(['kid_school', 'kid_card', 'kid_routines', 'custody', 'childcare']);
  });

  it('écrans du 19-21/11/2026 rangés : Se comprendre (couple), Ma place (organisation), Missions terminées et Messages en sous-accès, Mes informations (compte)', () => {
    expect(cat('couple_understand')).toBe('couple');
    expect(cat('family_my_place')).toBe('family');
    expect(cat('childcare')).toBe('school');
    expect(cat('my_info')).toBe('account');
    expect(canonicalToolId('family_missions_done')).toBe('family_missions.done');
    expect(canonicalToolId('community_messages')).toBe('community.messages');
    const fam = toolCatalog({ scope: 'family' });
    expect(findEntry(fam, 'family_missions.done')).toMatchObject({ parent: 'family_missions', href: '/family/missions/done' });
    expect(findEntry(fam, 'community.messages')).toMatchObject({ parent: 'community', href: '/community/messages', category: 'community' });
    // Messages n'est pas une catégorie : il reste dans l'espace Communauté
    for (const shelf of TOOL_CATEGORIES) expect(categoryContent(fam, shelf).readings.some((x) => x.id === 'community.messages')).toBe(false);
  });

  it('raccourcis contextuels : jamais la catégorie principale, même objet (un identifiant, un favori)', () => {
    for (const d of TOOLS) for (const c of d.also ?? []) {
      expect([d.id, c !== d.category && (TOOL_CATEGORIES as string[]).includes(c)]).toEqual([d.id, true]);
    }
    for (const c of CTXS) {
      const tools = toolCatalog(c);
      expect(new Set(tools.map((x) => x.id)).size).toBe(tools.length);
      for (const shelf of TOOL_CATEGORIES) {
        const { tools: own, shortcuts } = categoryContent(tools, shelf);
        for (const x of shortcuts) { expect(tools).toContain(x); expect(own).not.toContain(x); expect(x.category).not.toBe(shelf); }
      }
    }
    // un favori posé depuis un raccourci est le favori de l'outil
    const baby = toolCatalog({ scope: 'baby', childId: 'c1' });
    expect(favoriteTools(baby, ['scan_avoid']).map((x) => x.category)).toEqual(['health']);
  });

  it('migration : identifiants, alias, anciens liens de catégorie et favoris sont conservés', () => {
    expect(canonicalCategory('growth')).toBe('care');
    expect(categoryFromParam('growth')).toBe('care');
    expect(categoryFromParam('sleep')).toBe('sleep');
    expect(categoryFromParam('nexiste_pas')).toBeNull();
    // favoris d'avant le reclassement (identifiants stables et anciennes clés « thème:adresse »)
    const favs = migrateToolIds(['baby_diaper', 'scan_product', 'community', 'kid_products', 'recall_alerts', 'diapers:/(tabs)/track', 'resources:/(tabs)/community?space=grossesse', 'growth:/child/:id/growth', 'ttc_calendar']);
    expect(favs).toEqual(['baby_diaper', 'scan_product', 'community', 'kid_products', 'recall_alerts', 'baby_daily', 'kid_profile.growth', 'cycle_calendar']);
    const baby = toolCatalog({ scope: 'baby', childId: 'c1' });
    expect(favoriteTools(baby, favs).map((x) => [x.id, x.category])).toEqual([
      ['baby_diaper', 'care'], ['scan_product', 'care'], ['community', 'community'], ['kid_products', 'care'], ['recall_alerts', 'health'], ['baby_daily', 'care'], ['kid_profile.growth', 'care'],
    ]);
    expect(findEntry(baby, 'community')?.href).toBe('/(tabs)/community?space=parents-bebes');
  });
});

// ------------------------------------------------------------------ C. descriptions de liste
describe('C. descriptions : entières dans la liste', () => {
  /** Longueur maximale d'une description de liste (≈ 3 lignes à 390 pt, 4 lignes à 320 pt ou en grand texte). */
  const DESC_MAX: Record<(typeof LANGS)[number], number> = { fr: 100, en: 100, es: 100, de: 100, it: 100 };

  it.each(LANGS)('%s : aucune description d’outil ne dépasse la longueur de liste', (lang) => {
    setLocale(lang);
    const long = TOOLS.map((d) => [d.id, (tMaybe(toolDescKey(d.id)) ?? '').length] as const).filter(([, n]) => n > DESC_MAX[lang] || n < 30);
    expect(long).toEqual([]);
    setLocale('fr');
  });

  it('la rangée affiche la phrase entière jusqu’à 4 lignes (plus de coupe à 2 lignes), hauteur flexible', () => {
    const row = read('src/features/toolHub/ToolRow.tsx');
    expect(row).toContain('TOOL_DESC_LINES = 4');
    expect(row).toContain('numberOfLines={TOOL_DESC_LINES}');
    expect(row).not.toMatch(/numberOfLines=\{[123]\}/);
    expect(row).toContain('minHeight: TOOL_ROW_MIN_HEIGHT');
    expect(row).not.toMatch(/[^n]height: TOOL_ROW/);
    // la fiche affiche toujours la phrase complète
    expect(read('src/features/toolHub/ToolSheet.tsx')).toMatch(/\{tool\.sub \? <Text>\{tool\.sub\}<\/Text> : null\}/);
  });
});

// ------------------------------------------------------------------ D. compatibilité
/** Les 120 outils d'avant le reclassement (commit 886fa36, MATRICE_OUTILS.csv) : identifiant → adresse ouverte. */
const BEFORE = `meals=/meals?for=avoid meal_menu=/meals/menu meal_pantry=/meals/pantry scan_food=/scanner/food sleep=/me/sleep appointments=/appointments consult_questions=/consult/questions documents=/documents health_book=/documents/book medications=/medications mood=/me/mood me_diary=/me/diary exhaustion_check=/family/exhausted emergency=/emergency ask=/(tabs)/ask local_ai=/assistant/local library=/library guides=/guide videos=/videos sources=/sources cycle_home=/cycle?all=1 cycle_calendar=/cycle/calendar cycle_symptoms=/cycle/symptoms cycle_pain=/cycle/pain cycle_discharge=/cycle/discharge cycle_bleeding=/cycle/bleeding cycle_stats=/cycle/stats cycle_guides=/cycle/guides cycle_kit=/cycle/kit avoid_contraception=/contraception avoid_methods=/contraception/methods avoid_emergency=/contraception/emergency avoid_reminders=/contraception/reminders avoid_consult=/contraception/consultation contraception_journal=/contraception/journal ttc_start_pregnancy=/pregnancy/start mental_load=/family/load family_domains=/family/domains couple_week=/family/couple family_metime=/family/me-time offduty=/family/offduty family_difficult=/family/difficult solo_parent=/family/solo community=/(tabs)/community?space=eviter-grossesse family_calendar=/calendar family_tasks=/family family_missions=/family/missions family_routines=/family/routines brain_dump=/family/brain-dump family_prep=/family/prep family_shopping=/meals/shopping family_stocks=/family/stocks house_notebook=/family/notebook family_papers=/family/papers reminders=/settings/reminders nearby=/outings scan_product=/scanner/product scan_compare=/scanner/compare scan_history=/scanner/history scan_avoid=/scanner/avoid recall_alerts=/scanner/recalls ttc_cycle=/fertility ttc_tests=/fertility/log ttc_mucus=/fertility/mucus ttc_temperature=/fertility/body ttc_intimacy=/fertility/intimacy ttc_exams=/fertility/exams ttc_understand=/fertility/understand ttc_consult=/fertility/consultation ttc_reminders=/fertility/reminders pma_tracker=/fertility/pma preg_names=/names cycle_journal=/cycle/journal kid_products=/products preg_eat=/pregnancy/eat family_nights=/family/nights summary=/summary preg_evolution=/pregnancy preg_weight=/pregnancy/weight preg_feel=/pregnancy/feel preg_moves=/pregnancy/moves preg_calendar=/pregnancy/calendar preg_lists=/lists baby_breastfeed=/track/breastfeed?child=c1 baby_bottle_timer=/bottle/c1 bottle_scoops=/bottle/scoops pp_recovery=/postpartum pp_checkin=/postpartum/checkin pp_body=/postpartum/recovery pp_mental=/postpartum/understand pp_support=/postpartum/support pp_partner=/postpartum/partner family_urgent=/family/urgent family_sos=/family/sos baby_bottle=/track/bottle?child=c1 baby_bottle_history=/bottle/history?child=c1 baby_diaper=/track/diaper?child=c1 baby_foods=/child/c1/discoveries meal_rankings=/meals/rankings kid_sleep=/night?child=c1 kid_sleep_rhythm=/sleep/c1 sleep_help=/sleep/help/c1 baby_night_help=/night/help?child=c1 kid_profile=/child/c1 kid_grow=/child/c1/grow kid_teeth=/teeth?child=c1 kid_mood=/child/c1/wellbeing kid_album=/child/c1/album baby_daily=/(tabs)/track journal=/journal kid_vaccines=/child/c1/vaccines kid_health=/child/c1/health-tracking kid_treatments=/child/c1/needs?tab=treatments kid_school=/child/c1/school kid_card=/child/c1/card custody=/family/custody kid_steps=/child/c2/steps kid_routines=/family/kid-routines family_review=/family/review family_history=/family/history`
  .split(' ').map((x) => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)] as const; });

describe('D. compatibilité : anciens identifiants, alias et adresses', () => {
  beforeAll(() => setLocale('fr'));

  it('les 120 outils d’avant existent toujours, sous le même identifiant, et ouvrent la même adresse (paramètres compris)', () => {
    expect(BEFORE).toHaveLength(120);
    const lost: string[] = [];
    for (const [id, href] of BEFORE) {
      const def = TOOLS.find((d) => d.id === id);
      const now = CTXS.flatMap((c) => toolsFor(c).filter((x) => x.id === id).map((x) => x.href));
      if (!def || !now.includes(href)) lost.push(`${id} → ${href} (aujourd’hui : ${[...new Set(now)].join(', ') || 'absent'})`);
    }
    expect(lost).toEqual([]);
  });

  it('chaque entrée du registre, pour chaque profil : route existante, paramètres du profil, règle d’accès, profil autorisé', () => {
    const bad: string[] = [];
    for (const d of TOOLS) {
      let reachable = false;
      for (const c of CTXS) {
        const entry = toolCatalog(c).find((x) => x.id === d.id) ?? (d.category === 'account' ? toolsFor(c).find((x) => x.id === d.id) : undefined);
        const expected = d.scopes.includes(c.scope) && (!d.when || d.when(c)) && !!d.href(c);
        if (!!entry !== expected) bad.push(`${d.id} / ${c.scope} : profil`);
        if (isToolAllowed(d.id, c) !== expected) bad.push(`${d.id} / ${c.scope} : isToolAllowed`);
        if (!entry) continue;
        reachable = true;
        if (!routeExists(entry.href)) bad.push(`${d.id} / ${c.scope} : route ${entry.href}`);
        if (entry.href !== d.href(c)) bad.push(`${d.id} / ${c.scope} : adresse`);
        // l'enfant affiché est transmis à l'écran (segment ou paramètre), jamais un autre
        const own = c.childId ?? c.babyId ?? null;
        const others = ['c1', 'c2'].filter((x) => x !== own);
        if (others.some((other) => new RegExp(`\\b${other}\\b`).test(entry.href))) bad.push(`${d.id} / ${c.scope} : mauvais enfant ${entry.href}`);
        if ('free' in entry && entry.free !== isFreeRoute(pathOf(entry.href))) bad.push(`${d.id} / ${c.scope} : accès`);
        for (const s of entry.subs) if (!routeExists(s.href)) bad.push(`${s.id} / ${c.scope} : route ${s.href}`);
      }
      if (!reachable) bad.push(`${d.id} : aucun profil`);
    }
    expect(bad).toEqual([]);
  });

  it('accès libre : exactement les urgences, la sécurité, les sources et l’espace nounou (règles de access.ts)', () => {
    const all = new Map(CTXS.flatMap((c) => toolCatalog(c)).map((x) => [x.id, x]));
    expect([...all.values()].filter((x) => x.free).map((x) => x.id).sort()).toEqual(['avoid_emergency', 'childcare', 'emergency', 'family_sos', 'family_urgent', 'pp_support', 'recall_alerts', 'sources']);
  });

  it('chaque alias mène à un outil ou à un sous-accès existant, autorisé pour les mêmes profils, sur une route existante', () => {
    const aliases = Object.keys(TOOL_ALIASES);
    expect(aliases.length).toBeGreaterThanOrEqual(31);
    for (const old of aliases) {
      const r = resolveTool(old);
      expect([old, !!r]).toEqual([old, true]);
      expect(canonicalToolId(old)).toBe(TOOL_ALIASES[old]);
      expect(TOOL_BY_ID[old]).toBe(r!.def);
      const ctxs = CTXS.filter((c) => allowedToolIds(c).includes(old));
      expect([old, ctxs.length > 0]).toEqual([old, true]);
      for (const c of ctxs) {
        expect(isToolAllowed(old, c)).toBe(true);
        const entry = findEntry(toolCatalog(c), r!.id);
        expect([old, c.scope, !!entry && routeExists(entry.href)]).toEqual([old, c.scope, true]);
      }
    }
  });

  it('les 138 adresses de l’ancien catalogue mènent à une entrée dont l’adresse existe', () => {
    for (const [oldPath, oldId] of Object.entries(LEGACY_PATHS)) {
      const now = canonicalToolId(oldId);
      expect([oldPath, !!now]).toEqual([oldPath, true]);
      const entry = CTXS.map((c) => findEntry(toolCatalog(c), now!) ?? toolsFor(c).find((x) => x.id === now)).find(Boolean);
      expect([oldPath, !!entry && routeExists(entry!.href)]).toEqual([oldPath, true]);
    }
  });

  it('un nom unique par outil, lu au même endroit par tous les écrans', () => {
    expect(toolName('baby_diaper')).toBe('Couches');
    expect(toolName('pp_feeding')).toBe(toolName('baby_breastfeed'));
    expect(toolName('kid_growth')).toBe(tMaybe('tool.kid_growth'));
  });
});
