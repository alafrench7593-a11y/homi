#!/usr/bin/env node
/**
 * HOMI — inventaire des écrans et grille de couverture par OUTIL pour la refonte
 * « Apple Keynote × Black Mirror × Liquid Glass ».
 *
 * Régénère HOMI_SCREEN_INVENTORY.csv (une ligne par fichier d'écran, puis une ligne par outil du catalogue) et
 * HOMI_SCREEN_INVENTORY.md (synthèse par zone, vue par outil, outils pilotes).
 *
 * Sources :
 *  - src/lib/routes.generated.ts (routes réelles) + fichiers de src/app (mêmes règles que scripts/gen-routes.js) ;
 *  - MATRICE_OUTILS.csv (catalogue des outils, écrit par src/__tests__/homiToolMatrix.test.ts) ;
 *  - scripts/homi/inventory-status.json : statuts saisis à la main (écrans : « à faire / tranche / fait » ;
 *    outils : « écrans refondus / commandes adaptées / transition implémentée / parcours vérifié »).
 *    C'est le SEUL fichier à modifier au fil de la refonte ; le reste est calculé.
 *
 * Usage : node scripts/homi/inventory.mjs          (écrit les deux fichiers)
 *         node scripts/homi/inventory.mjs --check  (échoue si les fichiers ne sont pas à jour)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = path.join(ROOT, 'src', 'app');
const OUT_CSV = path.join(ROOT, 'HOMI_SCREEN_INVENTORY.csv');
const OUT_MD = path.join(ROOT, 'HOMI_SCREEN_INVENTORY.md');
const STATUS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'homi', 'inventory-status.json'), 'utf8'));

// ------------------------------------------------------------------ routes et fichiers
const routesFile = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'routes.generated.ts'), 'utf8');
const ROUTES = [...routesFile.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]);

/** Fichiers d'écran (mêmes règles que gen-routes.js) : [{ file, route }] triés par route puis fichier. */
function screenFiles() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.tsx$/.test(e.name) || e.name.startsWith('_') || e.name.startsWith('+')) continue;
      if (/\.(web|ios|android|native)\.tsx$/.test(e.name)) continue;
      const rel = path.relative(APP, p).replace(/\\/g, '/');
      let r = rel.replace(/\.tsx$/, '').split('/').filter((s) => !/^\(.*\)$/.test(s)).join('/');
      r = '/' + r.replace(/(^|\/)index$/, '');
      if (r !== '/' && r.endsWith('/')) r = r.slice(0, -1);
      out.push({ file: rel, route: r });
    }
  })(APP);
  return out.sort((a, b) => a.route.localeCompare(b.route) || a.file.localeCompare(b.file));
}

// ------------------------------------------------------------------ zones
const ZONES = [
  ['Auth / entrée', (r, f) => /^\/(welcome|intro|cinematic|onboarding)$/.test(r) || r.startsWith('/auth/') || (r === '/' && f === 'index.tsx')],
  ['Admin', (r) => r.startsWith('/admin')],
  ['Réglages', (r) => r.startsWith('/settings') || /^\/(journeys|premium|feedback|notifications|profiles\/new|profile|legal\/\[doc\])/.test(r)],
  ['Accueil', (r, f) => (r === '/' && f !== 'index.tsx') || /^\/(today|tools|track|track\/\[kind\]|summary|story|agenda|calendar|household|moi|ask|assistant\/.*|me|me\/.*|health|journal)$/.test(r)],
  ['Santé', (r) => /^\/(appointments|documents|emergency|medications|consult|teeth|scanner|products|guide\/\[topic\]|article|library|sources|tutos|videos|nearby|outings)/.test(r)],
  ['Cycle et fertilité', (r) => /^\/(cycle|fertility|contraception|partner\/cycle)/.test(r)],
  ['Grossesse et post-partum', (r) => /^\/(pregnancy|postpartum|names|lists)/.test(r)],
  ['Bébé et enfant', (r) => /^\/(baby|bottle|child|sleep|night|meals)/.test(r)],
  ['Famille', (r) => r.startsWith('/family')],
  ['Communauté', (r) => r.startsWith('/community')],
];
const zoneOf = (r, f) => (ZONES.find(([, test]) => test(r, f)) ?? ['Autres'])[0];

// ------------------------------------------------------------------ rôle
const ROLE_RULES = [
  ['scène', (r, src) => /^\/(welcome|intro|cinematic|story|night|sleep\/tonight)$/.test(r) || (r === '/' && !/Screen/.test(src))],
  ['réglage', (r) => r.startsWith('/settings') || r.startsWith('/admin') || /\/(reminders|privacy|settings|home-card|blocked|rules|language)$/.test(r)],
  ['historique', (r) => /\/(history|journal|diary|log|activity|recap|album|albums|saved)$/.test(r)],
  ['formulaire', (r, src) => /\/(new|edit|start|end|checkin|feel|sign-in|sign-up|forgot|reset|onboarding|brain-dump|scan|import-recipes|consultation|questions)$/.test(r) || r === '/onboarding' || ((src.match(/<Field\b/g) ?? []).length >= 3 && !/VirtualList|FlatList|QueryView/.test(src))],
  ['résultat', (r) => /\/(result\/\[id\]|stats|compare|review|summary|card|export|recap|rankings|share|risk|month)$/.test(r) || r === '/summary'],
  ['détail', (r) => /\[[^\]]+\]$/.test(r) || r.startsWith('/guide/') || r.startsWith('/legal/') || r.startsWith('/article/')],
  ['liste', (_r, src) => /VirtualList|FlatList|SectionList|QueryView|\.map\(/.test(src)],
];
const roleOf = (r, src) => (ROLE_RULES.find(([, test]) => test(r, src)) ?? ['détail'])[0];

// ------------------------------------------------------------------ composants partagés et couleurs en dur
const SHARED = ['Screen', 'Card', 'GlowCard', 'GlassSurface', 'LiquidGlass', 'Sheet', 'Field', 'Button', 'IconButton', 'Banner', 'Chip', 'Segmented', 'Toggle', 'ListRow', 'SectionTitle', 'EmptyState', 'ErrorView', 'QueryView', 'Skeleton', 'VirtualList', 'ToolCard', 'MiniApp', 'Fab', 'Cascade', 'LiftCard', 'DetailEnter', 'PressableScale', 'AnimatedNumber', 'CompletionCheck', 'EntryHero', 'EntryScreen', 'MattePanel', 'FocalMark'];
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
function componentsOf(src) {
  return SHARED.filter((c) => new RegExp(`<${c}[\\s/>]`).test(src));
}
/** Couleurs littérales (#hex, rgb[a](…), hsl(…)) dans le code (commentaires exclus). */
function hardColors(src) {
  const code = stripComments(src);
  const hex = code.match(/['"`]#[0-9a-fA-F]{3,8}\b/g) ?? [];
  const fn = code.match(/\b(rgba?|hsla?)\(\s*\d/g) ?? [];
  const named = code.match(/:\s*['"](white|black)['"]/gi) ?? [];
  return hex.length + fn.length + named.length;
}

// ------------------------------------------------------------------ catalogue d'outils
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const TOOLS = parseCsv(fs.readFileSync(path.join(ROOT, 'MATRICE_OUTILS.csv'), 'utf8'));

const routeRegex = (r) => new RegExp('^' + r.replace(/[.*+?^${}()|\\]/g, '\\$&').replace(/\\?\[[^\]]+\\?\]/g, '[^/]+') + '$');
const ROUTE_RX = ROUTES.map((r) => ({ r, rx: routeRegex(r), dyn: /\[/.test(r) }));
/** Route réelle d'une adresse d'outil (« /(tabs)/community?space=x » → « /community », « /child/c1 » → « /child/[id] »). */
function routeForHref(href) {
  const clean = href.split('?')[0].replace(/\/\([^)]+\)/g, '') || '/';
  if (ROUTES.includes(clean)) return clean;
  const hit = ROUTE_RX.find((x) => x.dyn && x.rx.test(clean));
  return hit ? hit.r : '';
}

const TYPE_BY_KEY = {
  'humeur/journal': ['mood', 'preg_feel', 'pp_checkin', 'kid_mood', 'brain_dump', 'house_notebook', 'kid_milestones', 'cycle_journal', 'contraception_journal', 'preg_names', 'baby_foods', 'kid_grow'],
  'minuteur/session': ['pp_bottle', 'baby_bottle', 'pp_feeding', 'kid_sleep', 'baby_night_help', 'preg_moves', 'offduty', 'bottle_scoops', 'baby_diaper'],
  'formulaire/assistant': ['ask', 'local_ai', 'consult_questions', 'avoid_consult', 'ttc_consult', 'exhaustion_check', 'family_difficult', 'family_sos', 'family_urgent', 'preg_edit', 'preg_end', 'ttc_start_pregnancy', 'journeys', 'settings', 'home_settings', 'kid_card', 'kid_profile', 'documents', 'scan_product', 'scan_food', 'scan_compare', 'avoid_methods', 'avoid_emergency', 'kid_needs', 'kid_steps', 'emergency', 'family_papers'],
  'famille/partage/communauté': ['community', 'family_nights', 'mental_load', 'couple_week', 'family_domains', 'pp_partner', 'solo_parent', 'family_summary', 'guide_couple', 'custody', 'family_review'],
  'tâches/planning': ['family_tasks', 'family_routines', 'kid_routines', 'family_calendar', 'family_prep', 'preg_calendar', 'appointments', 'reminders', 'notifications', 'avoid_reminders', 'ttc_reminders', 'family_metime', 'preg_lists', 'meals', 'family_history', 'cycle_kit'],
  'suivi/mesures': ['sleep', 'avoid_cycle', 'avoid_fertile', 'cycle_symptoms', 'cycle_stats', 'ttc_cycle', 'ttc_tests', 'ttc_mucus', 'ttc_temperature', 'ttc_intimacy', 'pma_tracker', 'preg_evolution', 'preg_weight', 'pp_recovery', 'pp_body', 'baby_bottle_history', 'kid_sleep_rhythm', 'baby_daily', 'kid_teeth', 'kid_growth', 'kid_vaccines', 'kid_health', 'kid_treatments', 'scan_history', 'scan_avoid', 'recall_alerts', 'ttc_exams'],
};
const KEY_TYPE = Object.fromEntries(Object.entries(TYPE_BY_KEY).flatMap(([type, keys]) => keys.map((k) => [k, type])));
const toolType = (key) => KEY_TYPE[key] ?? 'autre';

// ------------------------------------------------------------------ calcul
const files = screenFiles();
const rows = files.map(({ file, route }) => {
  const src = fs.readFileSync(path.join(APP, file), 'utf8');
  return {
    route, file: `src/app/${file}`, zone: zoneOf(route, file), role: roleOf(route, src),
    components: componentsOf(src), colors: hardColors(src), legacyAnimated: /\bAnimated\.(View|Value|timing|spring|loop)\b/.test(src) && /from 'react-native'/.test(src) && /\bAnimated\b[^;]*from 'react-native'/.test(src),
    usesSheet: /<Sheet[\s/>]/.test(src), status: STATUS.screens[file] ?? 'à faire', tools: [],
  };
});
const byRoute = new Map();
for (const r of rows) byRoute.set(r.route, [...(byRoute.get(r.route) ?? []), r]);

// Un outil par identifiant (le même écran peut servir plusieurs parcours)
const toolRows = [];
const seen = new Set();
for (const t of TOOLS) {
  if (seen.has(t.id)) continue;
  seen.add(t.id);
  const route = routeForHref(t.ecran);
  for (const r of byRoute.get(route) ?? []) if (!r.tools.includes(t.outil_cle)) r.tools.push(t.outil_cle);
  toolRows.push({ ...t, route });
}

/** Parcours d'un outil : entrée → saisie → résultat → historique, d'après les routes sœurs qui existent. */
function journeyOf(route) {
  if (!route) return { entry: '', input: '', result: '', history: '' };
  const segs = route.split('/').filter(Boolean);
  // Parcours = l'écran et ses routes sœurs (même dossier) ; un écran de premier niveau prend ses sous-routes
  const prefix = segs.length >= 2 || /\[/.test(segs[0] ?? '') ? '/' + segs.slice(0, -1).join('/') : route;
  const desc = prefix === '/' ? [] : ROUTES.filter((r) => r !== route && r.startsWith(prefix + '/'));
  const related = desc.length <= 8 ? desc : []; // au-delà : un hub (famille, cycle…), pas un parcours d'outil
  const main = (byRoute.get(route) ?? [])[0];
  const pick = (roles) => related.filter((r) => roles.includes((byRoute.get(r) ?? [])[0]?.role)).join(' ');
  const inScreen = main?.usesSheet ? 'feuille dans l’écran' : main?.role === 'formulaire' ? 'dans l’écran' : '';
  return {
    entry: route,
    input: pick(['formulaire']) || inScreen,
    result: pick(['résultat', 'détail']),
    history: pick(['historique', 'liste']) || (main?.role === 'historique' ? route : ''),
  };
}

// ------------------------------------------------------------------ sorties
const csvCell = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const HEAD = ['type_ligne', 'zone', 'route', 'fichier', 'role', 'outils_catalogue', 'composants_partages', 'couleurs_en_dur', 'animated_rn_herite', 'statut_refonte',
  'outil_id', 'outil_cle', 'libelle_fr', 'theme', 'type_outil', 'parcours_entree', 'parcours_saisie', 'parcours_resultat', 'parcours_historique',
  'ecrans_refondus', 'commandes_adaptees', 'transition_implementee', 'parcours_verifie'];
const lines = [HEAD.join(',')];
for (const r of rows) {
  lines.push([
    'ecran', r.zone, r.route, r.file, r.role, r.tools.join(' '), r.components.join(' '), r.colors, r.legacyAnimated ? 'oui' : 'non', r.status,
    '', '', '', '', '', '', '', '', '', '', '', '', '',
  ].map(csvCell).join(','));
}
const TOOL_STATUS_DEFAULT = { ecrans_refondus: 'non', commandes_adaptees: 'non', transition_implementee: 'non', parcours_verifie: 'non' };
for (const t of toolRows) {
  const j = journeyOf(t.route);
  const st = { ...TOOL_STATUS_DEFAULT, ...(STATUS.tools[t.id] ?? {}) };
  const zone = t.route ? zoneOf(t.route, (byRoute.get(t.route) ?? [])[0]?.file.replace('src/app/', '') ?? '') : '';
  lines.push([
    'outil', zone, t.route, '', '', '', '', '', '', '',
    t.id, t.outil_cle, t.libelle_fr, t.theme, toolType(t.outil_cle), j.entry, j.input, j.result, j.history,
    st.ecrans_refondus, st.commandes_adaptees, st.transition_implementee, st.parcours_verifie,
  ].map(csvCell).join(','));
}
const csv = lines.join('\n') + '\n';

// Markdown
const uniqueRoutes = new Set(rows.map((r) => r.route));
const zones = [...new Set(rows.map((r) => r.zone))].sort((a, b) => ZONES.findIndex(([z]) => z === a) - ZONES.findIndex(([z]) => z === b));
const count = (list, k) => list.filter((r) => r.status === k).length;
const md = [];
md.push('# HOMI — Inventaire des écrans et grille de couverture par outil');
md.push('');
md.push('> Fichier GÉNÉRÉ par `node scripts/homi/inventory.mjs` (vérification : `--check`). Ne pas modifier à la main :');
md.push('> les statuts se saisissent dans `scripts/homi/inventory-status.json`, puis on relance le script.');
md.push('> Données brutes : `HOMI_SCREEN_INVENTORY.csv` (lignes `ecran` puis lignes `outil`).');
md.push('');
md.push(`**${uniqueRoutes.size} routes** réelles (\`src/lib/routes.generated.ts\`) portées par **${rows.length} fichiers** d’écran (la route \`/\` a deux fichiers : l’aiguillage de lancement \`src/app/index.tsx\` et l’Accueil \`src/app/(tabs)/index.tsx\`). **${toolRows.length} outils** du catalogue (\`MATRICE_OUTILS.csv\`).`);
md.push('');
md.push('## Colonnes');
md.push('');
md.push('- **rôle** (heuristique sur la route et le code) : liste · formulaire · détail · résultat · historique · réglage · scène.');
md.push('- **outils** : clés du catalogue dont l’adresse mène à cet écran (`/child/c1` → `/child/[id]`, requête ignorée).');
md.push('- **composants** : composants partagés utilisés DIRECTEMENT dans le fichier (ceux d’un module `src/features/**` importé ne sont pas comptés).');
md.push('- **couleurs en dur** : littéraux `#hex`, `rgb[a]()`, `hsl[a]()`, `white/black` dans le fichier (commentaires exclus). Objectif refonte : 0 (tout passe par `useTheme()`).');
md.push('- **Animated RN** : l’écran utilise encore l’API `Animated` de React Native (à migrer vers `src/motion/**`).');
md.push('- **statut refonte** : à faire · tranche (refonte partielle) · fait.');
md.push('');
md.push('## Synthèse par zone');
md.push('');
md.push('| Zone | Fichiers | À faire | Tranche | Fait | Couleurs en dur | Animated RN |');
md.push('|---|---:|---:|---:|---:|---:|---:|');
for (const z of zones) {
  const l = rows.filter((r) => r.zone === z);
  md.push(`| ${z} | ${l.length} | ${count(l, 'à faire')} | ${count(l, 'tranche')} | ${count(l, 'fait')} | ${l.reduce((s, r) => s + r.colors, 0)} | ${l.filter((r) => r.legacyAnimated).length} |`);
}
md.push(`| **Total** | **${rows.length}** | **${count(rows, 'à faire')}** | **${count(rows, 'tranche')}** | **${count(rows, 'fait')}** | **${rows.reduce((s, r) => s + r.colors, 0)}** | **${rows.filter((r) => r.legacyAnimated).length}** |`);
md.push('');
const roles = [...new Set(rows.map((r) => r.role))].sort();
md.push(`Rôles : ${roles.map((ro) => `${ro} ${rows.filter((r) => r.role === ro).length}`).join(' · ')}.`);
md.push('');
md.push('## Pilotes proposés (à valider en premier)');
md.push('');
md.push('Choisis dans l’inventaire réel pour couvrir les trois formes d’outil ; chacun valide les surfaces, commandes et transitions avant la généralisation.');
md.push('');
md.push('| Pilote | Outil (clé) | Pourquoi | Routes du parcours |');
md.push('|---|---|---|---|');
for (const p of STATUS.pilots) md.push(`| ${p.kind} | ${p.label} (\`${p.key}\`) | ${p.why} | ${p.routes.map((r) => `\`${r}\``).join(' → ')} |`);
md.push('');
md.push('## Écrans par zone');
for (const z of zones) {
  md.push('');
  md.push(`### ${z}`);
  md.push('');
  md.push('| Route | Rôle | Outils | Composants | Couleurs | Animated RN | Statut |');
  md.push('|---|---|---|---|---:|:-:|---|');
  for (const r of rows.filter((x) => x.zone === z)) {
    const route = r.route === '/' ? `/ (${r.file.replace('src/app/', '')})` : r.route;
    md.push(`| \`${route}\` | ${r.role} | ${r.tools.join(', ') || '—'} | ${r.components.join(', ') || '—'} | ${r.colors} | ${r.legacyAnimated ? 'oui' : ''} | ${r.status} |`);
  }
}
md.push('');
md.push('## Vue par outil');
md.push('');
md.push('Types : humeur/journal · tâches/planning · suivi/mesures · minuteur/session · formulaire/assistant · famille/partage/communauté · autre. Parcours : entrée → saisie → résultat → historique, d’après les routes sœurs qui existent (« feuille dans l’écran » : la saisie se fait dans une feuille du même écran). Les quatre dernières colonnes se remplissent au fil de la refonte (`scripts/homi/inventory-status.json` › `tools`).');
const types = [...new Set(toolRows.map((t) => toolType(t.outil_cle)))].sort();
for (const ty of types) {
  const l = toolRows.filter((t) => toolType(t.outil_cle) === ty);
  md.push('');
  md.push(`### ${ty} (${l.length})`);
  md.push('');
  md.push('| Outil | Clé | Entrée | Saisie | Résultat | Historique | Écrans refondus | Commandes | Transition | Parcours vérifié |');
  md.push('|---|---|---|---|---|---|:-:|:-:|:-:|:-:|');
  for (const t of l) {
    const j = journeyOf(t.route);
    const st = { ...TOOL_STATUS_DEFAULT, ...(STATUS.tools[t.id] ?? {}) };
    const c = (v) => (v ? `\`${v}\`` : '—');
    md.push(`| ${t.libelle_fr} | \`${t.outil_cle}\` | ${c(j.entry || t.ecran)} | ${j.input && j.input.startsWith('/') ? c(j.input) : j.input || '—'} | ${c(j.result)} | ${c(j.history)} | ${st.ecrans_refondus} | ${st.commandes_adaptees} | ${st.transition_implementee} | ${st.parcours_verifie} |`);
  }
}
md.push('');
md.push('## Limites');
md.push('');
md.push('- Rôle, zone et type d’outil sont calculés par règles (fichier `scripts/homi/inventory.mjs`, tables `ZONES`, `ROLE_RULES`, `TYPE_BY_KEY`) : à corriger dans ces tables plutôt qu’à la main.');
md.push('- Les composants et couleurs sont comptés dans le fichier de route seul ; un écran qui délègue à `src/features/**` peut afficher 0 tout en contenant des couleurs en dur dans son module.');
md.push('- Un même outil peut figurer dans plusieurs parcours (même écran, paramètre différent) : une ligne par identifiant du catalogue.');
md.push('');
const mdText = md.join('\n');

if (process.argv.includes('--check')) {
  const okCsv = fs.existsSync(OUT_CSV) && fs.readFileSync(OUT_CSV, 'utf8') === csv;
  const okMd = fs.existsSync(OUT_MD) && fs.readFileSync(OUT_MD, 'utf8') === mdText;
  if (!okCsv || !okMd) { console.error('Inventaire HOMI pas à jour : node scripts/homi/inventory.mjs'); process.exit(1); }
} else {
  fs.writeFileSync(OUT_CSV, csv);
  fs.writeFileSync(OUT_MD, mdText);
}
console.log(`${uniqueRoutes.size} routes, ${rows.length} fichiers, ${toolRows.length} outils · fait ${count(rows, 'fait')}, tranche ${count(rows, 'tranche')}, à faire ${count(rows, 'à faire')}`);
