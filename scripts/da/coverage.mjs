#!/usr/bin/env node
/**
 * Audit « Liquid Glass + Full Motion partout » — couverture MESURÉE, écran par écran (docs/DA_LIQUID_GLASS.md § 11).
 *
 *   node scripts/da/coverage.mjs                 # résumé + écrans non conformes
 *   node scripts/da/coverage.mjs --json <f>      # détail complet (une entrée par route)
 *   node scripts/da/coverage.mjs --min 90        # code de sortie 1 si la couverture est sous le seuil
 *
 * Méthode (analyse statique, AST TypeScript) :
 *  - une route = un fichier de src/app (hors _layout, +not-found, variantes .web/.ios/.android), même liste que
 *    scripts/gen-routes.js ;
 *  - son CODE = le fichier + tout ce qu'il importe, transitivement, dans src/app et src/features (le code propre à
 *    l'écran) ; src/components et src/motion forment la BIBLIOTHÈQUE commune, auditée une fois pour toutes (en tête du
 *    rapport) : un écran qui n'utilise que la bibliothèque hérite de ses retours ;
 *  - critères (chacun « sans objet » s'il ne s'applique pas à l'écran) :
 *      en-tête   : l'écran rend `Screen` (en-tête, retour, titre communs) — sinon exception justifiée (liste ci-dessous) ;
 *      appui     : aucun Pressable / Touchable* NU (sans `onPressIn`, sans style `({ pressed })`, sans gestionnaires
 *                  répandus d'un hook de pression) ; voiles de fond (`absoluteFill`) exclus ;
 *      feuilles  : aucune `Modal` de react-native posée à la main (les feuilles passent par `Sheet` / `GlassSheet`,
 *                  panneau de verre) — sauf visionneuse plein écran justifiée ;
 *      segments  : un rôle « tab » posé à la main doit venir avec un indicateur qui glisse (useIndicator,
 *                  useLiquidIndicator, Lens) ; `ChoiceGroup` / `Segmented` / `GlassSegmentedControl` en ont un ;
 *      listes    : un fichier qui SUPPRIME ou AJOUTE des entrées et les rend avec `.map(` doit animer l'ajout et la
 *                  suppression (MotionList / MotionItem, ListGroup — animé à la source —, `entering` / `exiting` /
 *                  `layout`, ReorderList) ;
 *      coche     : une case « fait » posée à la main (rôle checkbox hors Chip) doit dessiner sa coche
 *                  (CompletionCheck, SuccessCheck, DrawCheck, CheckMark, TaskCheck).
 *  Une route est CONFORME si tous ses critères applicables passent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const SRC = path.join(ROOT, 'src');
const APP = path.join(SRC, 'app');

// ------------------------------------------------------------------------------------------- exceptions justifiées
/** Écrans sans `Screen` par conception (route → raison). Tenue à jour à la main, revue à chaque audit. */
export const HEADER_EXCEPTIONS = {
  '/': 'redirection d’entrée (aucun contenu affiché)',
  '/welcome': 'écran d’accueil plein cadre (marque, pas d’en-tête de navigation)',
  '/intro': 'présentation plein cadre (scène animée, bouton Passer)',
  '/cinematic': 'scène cinématique plein cadre',
  '/auth/sign-in': 'parcours d’authentification (gabarit AuthShell)',
  '/auth/sign-up': 'parcours d’authentification (gabarit AuthShell)',
  '/auth/forgot': 'parcours d’authentification (gabarit AuthShell)',
  '/auth/reset': 'parcours d’authentification (gabarit AuthShell)',
  '/auth/callback': 'redirection technique (retour de lien magique)',
  '/start': 'parcours de première ouverture (gabarit d’étapes)',
  '/start/sample': 'redirection technique (famille d’exemple)',
  '/start/offers': 'parcours de première ouverture (gabarit d’étapes)',
  '/start/done': 'parcours de première ouverture (gabarit d’étapes)',
  '/premium': 'paywall (hors périmètre : achats)',
  '/dev/paywall': 'outil interne (paywall, hors périmètre)',
  '/dev/glass': 'banc d’essai interne de la bibliothèque de verre',
  '/dev/icons': 'banc d’essai interne des icônes',
  '/dev/aura-bot': 'banc d’essai interne du robot Aura',
  '/night': 'mode nuit plein écran (lecture minimale, pas d’en-tête)',
  '/ask': 'onglet Aura (conversation plein cadre, en-tête propre à Aura)',
  '/assistant': 'redirection vers la conversation d’Aura',
  '/discover': 'découverte sans compte (gabarit DemoPlayer)',
  '/discover/tools': 'redirection (découverte)',
  '/discover/tool/[id]': 'découverte sans compte (gabarit DemoPlayer)',
};
/** Modales plein écran légitimes (pas des feuilles) : fichier → raison. */
export const MODAL_EXCEPTIONS = {
  'src/app/garde/[id]/photos.tsx': 'visionneuse de photo plein écran (noir, pinch) — pas une feuille',
  'src/features/community.tsx': 'visionneuse de photo plein écran — pas une feuille',
};

// ------------------------------------------------------------------------------------------------ fichiers
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') walk(p, out); } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const isLibrary = (p) => /^src\/(components|motion)\//.test(rel(p));
const isScreenCode = (p) => /^src\/(app|features)\//.test(rel(p));

function routeOf(file) {
  let r = path.relative(APP, file).replace(/\\/g, '/').replace(/\.tsx$/, '');
  r = r.split('/').filter((s) => !/^\(.*\)$/.test(s)).join('/');
  r = r.replace(/(^|\/)index$/, '');
  return '/' + r;
}
function routeFiles() {
  return walk(APP).filter((p) => {
    const b = path.basename(p);
    return p.endsWith('.tsx') && !b.startsWith('_') && !b.startsWith('+') && !/\.(web|ios|android|native)\.tsx$/.test(b);
  });
}

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

// ------------------------------------------------------------------------------------------- analyse d'un fichier
const RAW_PRESS = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'TouchableNativeFeedback']);
const LIST_MOTION = /\b(MotionList|MotionItem|ListGroup|ReorderList|StaggerItem[^>]*fresh)\b|\b(entering|exiting|layout)=\{/;
const SLIDING = /\b(useIndicator|useLiquidIndicator|useLensSlide|Lens|GlassSegmentedControl|ChoiceGroup|Segmented|GlassTabBar)\b/;
const DRAWN_CHECK = /\b(CompletionCheck|SuccessCheck|DrawCheck|CheckMark|TaskCheck|CompletionGlow)\b/;
const cache = new Map();

function analyse(file) {
  if (cache.has(file)) return cache.get(file);
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const imports = [];
  const rnNames = new Set();
  const res = { file: rel(file), imports, rawPress: [], rawPressOk: 0, rawModal: [], tabs: 0, checkboxes: 0, usesScreen: false, sheets: 0 };
  sf.forEachChild((n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) {
      const spec = n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier) ? n.moduleSpecifier.text : null;
      if (!spec) return;
      const r = resolveImport(file, spec);
      if (r) imports.push(r);
      if (spec === 'react-native' && ts.isImportDeclaration(n) && n.importClause?.namedBindings && ts.isNamedImports(n.importClause.namedBindings)) {
        for (const el of n.importClause.namedBindings.elements) rnNames.add(el.name.text);
      }
    }
  });
  const attrText = (attrs, name) => {
    for (const a of attrs.properties) if (ts.isJsxAttribute(a) && a.name.getText(sf) === name) return a.initializer ? a.initializer.getText(sf) : 'true';
    return null;
  };
  const visit = (n) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      const attrs = n.attributes;
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      if (tag === 'Screen') res.usesScreen = true;
      if (tag === 'Sheet' || tag === 'GlassSheet' || tag === 'GlassModal') res.sheets++;
      if (RAW_PRESS.has(tag) && rnNames.has(tag)) {
        const style = attrText(attrs, 'style') ?? '';
        const spread = attrs.properties.some((a) => ts.isJsxSpreadAttribute(a) && /handlers|press|Press|\bp\b|\bpr\b/.test(a.getText(sf)));
        const feedback = !!attrText(attrs, 'onPressIn') || /\bpressed\b/.test(style) || spread || tag === 'TouchableHighlight';
        const backdrop = /absoluteFill/.test(style) || attrText(attrs, 'accessible') === '{false}' || attrText(attrs, 'disabled') === 'true';
        if (feedback || backdrop) res.rawPressOk++;
        else res.rawPress.push(`${tag}:${line}`);
      }
      if (tag === 'Modal' && rnNames.has('Modal')) res.rawModal.push(`Modal:${line}`);
      const role = attrText(attrs, 'accessibilityRole') ?? attrText(attrs, 'role') ?? '';
      if (/["']tab["']/.test(role)) res.tabs++;
      if (/["']checkbox["']/.test(role) && tag !== 'Chip') res.checkboxes++;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  res.sliding = SLIDING.test(code);
  res.drawnCheck = DRAWN_CHECK.test(code);
  res.listMotion = LIST_MOTION.test(code);
  res.segmentsUsed = /<(Segmented|ChoiceGroup|GlassSegmentedControl|GlassTabBar)\b/.test(code);
  // Ajout / suppression d'entrées rendues en liste (journaux, listes, tâches…)
  const mutates = /\b(remove|delete|del|archive|addItem|insertRow|deleteRow|removeItem|deleteEntry|removeEntry)\w*\s*\(|\.delete\(\)|\.from\([^)]*\)\s*\.insert\(/i.test(code);
  const rendersList = /\.map\(\s*\(?[\w{},\s:]*\)?\s*=>\s*\(?\s*<[A-Z]/.test(code) && /\bkey=\{/.test(code);
  res.dynamicList = mutates && rendersList;
  cache.set(file, res);
  return res;
}

function closure(entry) {
  const seen = new Set([entry]);
  const stack = [entry];
  while (stack.length) {
    const f = stack.pop();
    for (const d of analyse(f).imports) if (!seen.has(d) && isScreenCode(d)) { seen.add(d); stack.push(d); }
  }
  return [...seen];
}

// ------------------------------------------------------------------------------------------------- audit
export function audit() {
  const routes = routeFiles().map((f) => ({ file: f, route: routeOf(f) })).sort((a, b) => a.route.localeCompare(b.route));
  const lib = walk(path.join(SRC, 'components')).concat(walk(path.join(SRC, 'motion'))).map(analyse);
  const libRawPress = lib.flatMap((a) => a.rawPress.map((x) => `${a.file}:${x}`));
  const libRawModal = lib.flatMap((a) => a.rawModal.map((x) => `${a.file}:${x}`)).filter((x) => !/Overlays\.tsx|GlassOverlays\.tsx/.test(x));
  const rows = routes.map(({ file, route }) => {
    const files = closure(file).map(analyse);
    const own = analyse(file);
    const crit = {};
    // en-tête
    const usesScreen = files.some((a) => a.usesScreen);
    crit.header = usesScreen ? 'ok' : HEADER_EXCEPTIONS[route] ? 'exception' : 'fail';
    // appui
    const raw = files.flatMap((a) => a.rawPress.map((x) => `${a.file}:${x}`));
    crit.press = raw.length ? 'fail' : 'ok';
    // feuilles
    const modals = files.filter((a) => a.rawModal.length && !MODAL_EXCEPTIONS[a.file]).flatMap((a) => a.rawModal.map((x) => `${a.file}:${x}`));
    const hasSheet = files.some((a) => a.sheets || a.rawModal.length);
    crit.sheet = !hasSheet ? 'n/a' : modals.length ? 'fail' : 'ok';
    // segments
    const tabFiles = files.filter((a) => a.tabs);
    const hasSeg = tabFiles.length || files.some((a) => a.segmentsUsed);
    crit.segments = !hasSeg ? 'n/a' : tabFiles.some((a) => !a.sliding) ? 'fail' : 'ok';
    // listes
    const dyn = files.filter((a) => a.dynamicList);
    crit.lists = !dyn.length ? 'n/a' : dyn.some((a) => !a.listMotion) ? 'fail' : 'ok';
    // coche
    const boxes = files.filter((a) => a.checkboxes);
    crit.check = !boxes.length ? 'n/a' : boxes.some((a) => !a.drawnCheck) ? 'fail' : 'ok';
    const failing = Object.entries(crit).filter(([, v]) => v === 'fail').map(([k]) => k);
    return {
      route, file: rel(file), crit, conform: failing.length === 0, failing,
      detail: {
        rawPress: raw, rawModal: modals,
        listFiles: dyn.filter((a) => !a.listMotion).map((a) => a.file),
        tabFiles: tabFiles.filter((a) => !a.sliding).map((a) => a.file),
        checkFiles: boxes.filter((a) => !a.drawnCheck).map((a) => a.file),
        exception: crit.header === 'exception' ? HEADER_EXCEPTIONS[route] : undefined,
      },
      own: own.file,
    };
  });
  const per = {};
  for (const k of ['header', 'press', 'sheet', 'segments', 'lists', 'check']) {
    const app = rows.filter((r) => r.crit[k] !== 'n/a');
    per[k] = { applicable: app.length, ok: app.filter((r) => r.crit[k] !== 'fail').length };
  }
  const conform = rows.filter((r) => r.conform).length;
  return {
    total: rows.length, conform, percent: Math.round((conform / rows.length) * 1000) / 10, per,
    library: { files: lib.length, rawPress: libRawPress, rawModal: libRawModal },
    rows,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const r = audit();
  const args = process.argv.slice(2);
  const j = args.indexOf('--json');
  if (j >= 0) fs.writeFileSync(args[j + 1], JSON.stringify(r, null, 2));
  console.log(`Routes : ${r.total} · conformes : ${r.conform} (${r.percent} %)`);
  for (const [k, v] of Object.entries(r.per)) console.log(`  ${k.padEnd(9)} ${v.ok}/${v.applicable} (${v.applicable ? Math.round((v.ok / v.applicable) * 1000) / 10 : 100} %)`);
  console.log(`Bibliothèque : ${r.library.files} fichiers · appuis nus : ${r.library.rawPress.length} · Modal à la main : ${r.library.rawModal.length}`);
  for (const x of r.library.rawPress) console.log(`  lib appui nu  ${x}`);
  for (const x of r.library.rawModal) console.log(`  lib modal     ${x}`);
  const exc = r.rows.filter((x) => x.crit.header === 'exception');
  console.log(`Exceptions d’en-tête justifiées : ${exc.length}`);
  if (args.includes('--verbose')) for (const x of exc) console.log(`  ${x.route} — ${x.detail.exception}`);
  const bad = r.rows.filter((x) => !x.conform);
  console.log(`Non conformes : ${bad.length}`);
  for (const x of bad) console.log(`  ${x.route}  [${x.failing.join(', ')}]  ${[...x.detail.rawPress, ...x.detail.rawModal, ...x.detail.listFiles.map((f) => `liste:${f}`), ...x.detail.tabFiles.map((f) => `onglets:${f}`), ...x.detail.checkFiles.map((f) => `coche:${f}`)].slice(0, 6).join(' ')}`);
  const m = args.indexOf('--min');
  if (m >= 0 && r.percent < Number(args[m + 1])) process.exit(1);
}
