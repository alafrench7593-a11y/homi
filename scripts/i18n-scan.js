#!/usr/bin/env node
/**
 * Détection des textes affichés écrits en dur (au lieu de t('clé')) dans les écrans et composants.
 * Analyse l'arbre syntaxique TypeScript : textes JSX, chaînes passées aux propriétés visibles
 * (label, title, subtitle, placeholder, accessibilityLabel, body…), messages toast/confirm.
 * Usage : node scripts/i18n-scan.js [--json] [fichiers…]   (défaut : src/app, src/features, src/components)
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const VISIBLE_PROPS = new Set(['label', 'title', 'subtitle', 'placeholder', 'accessibilityLabel', 'accessibilityHint', 'body', 'hint', 'message', 'action', 'caption', 'description', 'emptyText', 'error', 'text', 'sub', 'confirmLabel']);
const VISIBLE_CALLS = new Set(['toast', 'confirm', 'setError', 'setNotice', 'Alert.alert']);
// Lettres et au moins un espace ou une ponctuation de phrase : un texte humain, pas un identifiant
const HUMAN = /[A-Za-zÀ-ÿ]{2,}/;
const LOOKS_TECH = /^([a-z0-9_./:@#-]+|[A-Z0-9_]+|#[0-9a-fA-F]{3,8}|https?:\/\/\S+|\/[\w/[\]().?=&-]*)$/;

function isHuman(s) {
  const t = s.trim();
  if (t.length < 2 || !HUMAN.test(t) || LOOKS_TECH.test(t) || /^`?url\(/.test(t)) return false;
  return /\s/.test(t) || /[A-ZÀ-Ü][a-zà-ÿ]/.test(t) || /[’'!?…:]/.test(t);
}

function scanFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits = [];
  const seen = new Set();
  const add = (node, text) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    const k = `${line}:${text.trim()}`;
    if (seen.has(k)) return;
    seen.add(k);
    hits.push({ line: line + 1, text: text.trim().slice(0, 80) });
  };
  const visit = (node) => {
    if (ts.isJsxText(node) && isHuman(node.getText())) add(node, node.getText());
    else if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText();
      if (VISIBLE_PROPS.has(name)) {
        const init = node.initializer;
        if (ts.isStringLiteral(init) && isHuman(init.text)) add(init, init.text);
        else if (ts.isJsxExpression(init) && init.expression) literalsIn(init.expression).forEach((l) => add(l, l.text));
      }
    } else if (ts.isCallExpression(node) && VISIBLE_CALLS.has(node.expression.getText())) {
      node.arguments.forEach((a) => literalsIn(a).forEach((l) => add(l, l.text)));
    } else if (ts.isJsxExpression(node) && node.parent && ts.isJsxElement(node.parent) && node.expression) {
      literalsIn(node.expression).forEach((l) => add(l, l.text));
    }
    ts.forEachChild(node, visit);
  };
  function literalsIn(expr) {
    const out = [];
    const walk = (n) => {
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && isHuman(n.text)) out.push(n);
      else if (ts.isTemplateExpression(n)) {
        if (isHuman(n.head.text + n.templateSpans.map((s) => s.literal.text).join(' '))) out.push({ text: n.getText(), getStart: () => n.getStart() });
        // gabarit neutre (`${a} : ${b}`) : les chaînes de ses expressions sont lues aussi (audit 09, ToolCard)
        else n.templateSpans.forEach((s) => walk(s.expression));
      }
      else if (ts.isCallExpression(n) && /^(t|tr)$/.test(n.expression.getText())) return; // déjà traduit
      else ts.forEachChild(n, walk);
    };
    walk(expr);
    return out;
  }
  visit(sf);
  return hits;
}

function listFiles(dirs) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx$/.test(e.name)) out.push(p);
    }
  };
  dirs.forEach((d) => walk(path.join(ROOT, d)));
  return out;
}

function scan(files) {
  const res = {};
  for (const f of files) { const h = scanFile(f); if (h.length) res[path.relative(ROOT, f)] = h; }
  return res;
}
module.exports = { scan, scanFile, listFiles, isHuman };

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter((a) => !a.startsWith('--'));
  const res = scan(files.length ? files.map((f) => path.resolve(f)) : listFiles(['src/app', 'src/features', 'src/components']));
  const total = Object.values(res).reduce((n, h) => n + h.length, 0);
  if (json) console.log(JSON.stringify({ total, files: res }, null, 1));
  else {
    Object.entries(res).sort((a, b) => b[1].length - a[1].length).forEach(([f, h]) => console.log(`${String(h.length).padStart(4)}  ${f}`));
    console.log(`\n${total} textes en dur dans ${Object.keys(res).length} fichiers.`);
  }
}
