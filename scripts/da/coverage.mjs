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
 *      listes    : sur un écran qui écrit des données (mutation, insert, delete), toute liste d'ENTRÉES rendue par
 *                  `.map((x) => <… key={x.id}>)` anime l'ajout et la suppression : MotionItem (dans MotionList),
 *                  `entering` / `layout`, ou rangées d'un ListGroup / ReorderList (animés à la source). Les listes
 *                  virtualisées (FlatList / VirtualList) ne sont pas comptées (recyclage : on n'anime que l'élément touché),
 *                  ni les rangées horizontales (tuiles, pastilles, points), ni les boutons / pastilles / repères de carte natifs, ni les
 *                  composants sans rendu (…Sync, …Host) ;
 *      coche     : dans un fichier qui pose des cases à cocher (rôle checkbox hors Chip), aucune coche FIGÉE
 *                  (pictogramme « check » posé tel quel) : la coche se trace (CheckMark, CompletionCheck,
 *                  SuccessCheck) ; une case sans coche (sélection par contour et graisse) passe.
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
  '/child/[id]/foods': 'redirection (ancien lien → onglet du profil enfant)',
  '/child/[id]/growth': 'redirection (ancien lien → onglet du profil enfant)',
  '/nearby': 'redirection (ancien lien → /outings)',
  '/family/urgent': 'urgences : écran minimal plein cadre, retour en un appui, rien entre la personne et l’appel',
  '/family/sos': 'SOS : écran minimal plein cadre, retour en un appui, rien entre la personne et l’appel',
  '/family/kid-routine/[id]': 'mode enfant plein écran : aucun menu ni lien sortant (sortie par appui long parent)',
  '/sleep/tonight': 'mode nuit plein écran sombre (lecture minimale, pas de chrome)',
  '/sleep/difficult/[childId]': 'nuit difficile : plein écran sombre, pas de chrome',
};
/** Modales plein écran légitimes (pas des feuilles) : fichier → raison. */
export const MODAL_EXCEPTIONS = {
  'src/app/garde/[id]/photos.tsx': 'visionneuse de photo plein écran (noir, pinch) — pas une feuille',
  'src/features/community.tsx': 'visionneuse de photo plein écran — pas une feuille',
  'src/app/fertility/mucus.tsx': 'visionneuse de photo plein écran — pas une feuille',
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
const isScreenCode = (p) => /^src\/(app|features)\//.test(rel(p)) && !OUT_OF_SCOPE.test(rel(p));
/** Hors périmètre (consigne : paywall, achats, crédits) : non modifiés, exclus de la mesure et listés à part. */
export const OUT_OF_SCOPE = /^src\/features\/(credits|firstWin|premium|offers)\/|^src\/features\/(Paywall|subscription)\.tsx$/;

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
const SLIDING = /\b(useIndicator|useLiquidIndicator|useLensSlide|Lens|GlassSegmentedControl|ChoiceGroup|Segmented|GlassTabBar|useSlidingUnderline)\b|translateX:\s*x\.value/;
const DRAWN_CHECK = /\b(CompletionCheck|SuccessCheck|DrawCheck|CheckMark|TaskCheck|CompletionGlow)\b/;
const cache = new Map();

function analyse(file) {
  if (cache.has(file)) return cache.get(file);
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const imports = [];
  const rnNames = new Set();
  const res = { file: rel(file), imports, rawPress: [], rawPressOk: 0, rawModal: [], tabs: 0, checkboxes: 0, staticChecks: 0, usesScreen: false, sheets: 0, plainSheets: 0 };
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
      if (tag === 'Sheet') res.plainSheets++;
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
      // coche FIGÉE : pictogramme « check » posé tel quel (au lieu d'une coche qui se trace)
      // (seulement une coche qui APPARAÎT selon un état : `état ? <Icon name="check"/> : …` ou `état && …` ; une légende fixe passe)
      if (/^(Icon|Feather|MaterialCommunityIcons|Ionicons)$/.test(tag) && /^["'](check|check-circle|check-square|check-bold|checkbox-marked(-circle)?)["']$/.test(attrText(attrs, 'name') ?? '')) {
        let up = n.parent; let cond = false;
        for (let k = 0; up && k < 4; k++, up = up.parent) if (ts.isConditionalExpression(up) || (ts.isBinaryExpression(up) && up.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken)) { cond = true; break; }
        if (cond) res.staticChecks++;
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  res.sliding = SLIDING.test(code);
  res.drawnCheck = DRAWN_CHECK.test(code);
  res.segmentsUsed = /<(Segmented|ChoiceGroup|GlassSegmentedControl|GlassTabBar)\b/.test(code);
  // Listes d'ENTRÉES : `.map((x) => <El key={x.id} …>)` (clé = identifiant d'une donnée enregistrée). Animée si l'élément
  // rendu est un MotionItem, porte `entering` / `layout`, ou vit dans un ListGroup / ReorderList (animés à la source).
  res.entryLists = [];
  const visitMaps = (n, anc) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'map' && n.arguments.length) {
      const fn = n.arguments[0];
      if ((ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && fn.parameters[0] && ts.isIdentifier(fn.parameters[0].name)) {
        const p = fn.parameters[0].name.text;
        let b = fn.body;
        while (b && ts.isParenthesizedExpression(b)) b = b.expression;
        if (b && ts.isBlock(b)) { const r = b.statements.filter(ts.isReturnStatement); b = r.length === 1 ? r[0].expression : null; while (b && ts.isParenthesizedExpression(b)) b = b.expression; }
        if (b && (ts.isJsxElement(b) || ts.isJsxSelfClosingElement(b))) {
          const op = ts.isJsxElement(b) ? b.openingElement : b;
          const tag = op.tagName.getText(sf);
          const key = attrText(op.attributes, 'key') ?? '';
          // receveur constant (CATALOGUE, OPTIONS…) = catalogue figé, pas des entrées enregistrées
          const recv = n.expression.expression.getText(sf);
          const staticRecv = /^[A-Z][A-Z0-9_]*$/.test(recv) || /^Object\.(keys|entries|values)\([A-Z][A-Z0-9_]*\)$/.test(recv);
          // conteneur le plus proche : une RANGÉE (tuiles, pastilles, points de pagination) n'est pas un journal d'entrées
          let up = n.parent;
          while (up && !ts.isJsxElement(up) && !ts.isJsxFragment(up) && !ts.isReturnStatement(up)) up = up.parent;
          const ctext = up && ts.isJsxElement(up) ? up.openingElement.getText(sf) : '';
          const rowish = /flexDirection:\s*'row'|flexWrap|horizontal/.test(ctext);
          const nonEntry = /^(Chip|Button|IconButton|Marker)$/.test(tag) || /(Sync|Host)$/.test(tag);
          if (!staticRecv && !rowish && !nonEntry && new RegExp(`^\\{\\s*(String\\()?${p}\\.(id|uuid)\\b`).test(key)) {
            const animated = tag === 'MotionItem' || !!attrText(op.attributes, 'entering') || !!attrText(op.attributes, 'layout') || anc.some((t) => t === 'ListGroup' || t === 'ReorderList');
            res.entryLists.push({ line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, tag, animated });
          }
        }
      }
    }
    const tagHere = ts.isJsxElement(n) ? n.openingElement.tagName.getText(sf) : null;
    ts.forEachChild(n, (c) => visitMaps(c, tagHere ? [...anc, tagHere] : anc));
  };
  visitMaps(sf, []);
  res.mutates = /\buseMutation\b|\bmutateAsync\b|\.insert\(|\.delete\(|\.upsert\(|\bdeleteRow\b|\binsertRow\b/.test(code);
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
const SHEET_IS_GLASS = /<Glass variant="sheet"/.test(fs.readFileSync(path.join(SRC, 'components', 'Overlays.tsx'), 'utf8'));

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
    // `Sheet` n'est une feuille de verre que si son panneau par défaut est le verre (Overlays.tsx)
    const plain = SHEET_IS_GLASS ? 0 : files.reduce((n, a) => n + a.plainSheets, 0);
    crit.sheet = !hasSheet ? 'n/a' : modals.length || plain ? 'fail' : 'ok';
    // segments
    const tabFiles = files.filter((a) => a.tabs);
    const hasSeg = tabFiles.length || files.some((a) => a.segmentsUsed);
    crit.segments = !hasSeg ? 'n/a' : tabFiles.some((a) => !a.sliding) ? 'fail' : 'ok';
    // listes
    const mut = files.some((a) => a.mutates);
    const lists = mut ? files.flatMap((a) => a.entryLists.map((l) => ({ ...l, file: a.file }))) : [];
    crit.lists = !lists.length ? 'n/a' : lists.some((l) => !l.animated) ? 'fail' : 'ok';
    // coche
    const boxes = files.filter((a) => a.checkboxes);
    crit.check = !boxes.length ? 'n/a' : boxes.some((a) => a.staticChecks) ? 'fail' : 'ok';
    const failing = Object.entries(crit).filter(([, v]) => v === 'fail').map(([k]) => k);
    return {
      route, file: rel(file), crit, conform: failing.length === 0, failing,
      detail: {
        rawPress: raw, rawModal: modals,
        listFiles: lists.filter((l) => !l.animated).map((l) => `${l.file}:${l.line}`),
        tabFiles: tabFiles.filter((a) => !a.sliding).map((a) => a.file),
        checkFiles: boxes.filter((a) => a.staticChecks).map((a) => a.file),
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
